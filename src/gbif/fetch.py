###############################################################################
##  `fetch.py`                                                               ##
##                                                                           ##
##  Purpose: Accesses GBIF's API endpoint to query data                      ##
###############################################################################


import csv
import io
import os
import time
import zipfile

import pandas as pd
import requests
from dotenv import load_dotenv

from src.config import (
    SPECIES_NAME,
    convert_ISO_code_to_country,
)
from src.gbif.constants import (
    GBIF_RAW_CSV,
)
from src.utils.api_utils import (
    find_field,
)
from src.utils.data_utils import (
    export_to_csv,
)

load_dotenv()

GBIF_USER = os.getenv("GBIF_USER")
GBIF_PASS = os.getenv("GBIF_PASS")
GBIF_EMAIL = os.getenv("GBIF_EMAIL")

BASE_URL = "https://api.gbif.org/v1"

SPECIES_MATCH_ENDPOINT = "species/match"
OCCURRENCE_SEARCH_ENDPOINT = "occurrence/search"

OCCURRENCE_DOWNLOAD_REQUEST_ENDPOINT = "occurrence/download/request"
OCCURRENCE_DOWNLOAD_ENDPOINT = "occurrence/download"
DATASET_ENDPOINT = "dataset"

# DWCA columns to cast from str to number, to match API result types
DWCA_NUMERIC_FIELDS = [
    "decimalLatitude",
    "decimalLongitude",
    "coordinateUncertaintyInMeters",
    "year",
    "month",
    "day",
]

# Media fields returned by occurrence search API (subset of multimedia.txt)
API_MEDIA_FIELDS = [
    "type",
    "format",
    "references",
    "created",
    "creator",
    "publisher",
    "license",
    "rightsHolder",
    "identifier",
]

# GBIF allows maximum limit of 300 per query as of March 2025
LIMIT = 200


def get_species_key(name: str = SPECIES_NAME) -> int:
    url_endpoint = f"{BASE_URL}/{SPECIES_MATCH_ENDPOINT}"
    params = {"scientificName": name}

    response = requests.get(url_endpoint, params=params)
    response.raise_for_status()

    data = response.json()
    species_key = find_field(data, "speciesKey")

    if not species_key:
        raise ValueError(f"No species key found for '{name}'")
    return species_key


def get_occurrence_search(
    offset: int,
    limit: int = LIMIT,
    name: str = SPECIES_NAME,
    key: int = get_species_key(),
) -> dict:
    if offset is None:
        raise ValueError("ERROR: missing offset")

    url_endpoint = f"{BASE_URL}/{OCCURRENCE_SEARCH_ENDPOINT}"
    params = {
        "offset": offset,
        "limit": limit,
        "scientificName": name,
        "speciesKey": key,
    }

    response = requests.get(url_endpoint, params=params)
    response.raise_for_status()

    data = response.json()
    return data


def get_all_occurrences_raw_from_iterative_fetch() -> list:
    raw_occurrences = []
    offset = 0

    while True:
        raw_data = get_occurrence_search(offset)

        for occurrence in raw_data["results"]:
            raw_occurrences.append(occurrence)

        # Stop if fetched all records
        if offset + LIMIT >= raw_data.get("count", 0):
            break

        offset += LIMIT

    # Export raw dataset
    raw_occurrencess_df = pd.DataFrame(raw_occurrences)
    export_to_csv(GBIF_RAW_CSV, raw_occurrencess_df)

    return raw_occurrences


def request_occurrence_download(
    key: int = get_species_key(),
) -> str:
    url_endpoint = f"{BASE_URL}/{OCCURRENCE_DOWNLOAD_REQUEST_ENDPOINT}"

    payload = {
        "notificationAddresses": [GBIF_EMAIL],
        "sendNotification": False,
        # SIMPLE_CSV lacks many fields we need (e.g. media, sex, organismID),
        # whereas DWCA includes full interpreted occurrence + multimedia tables
        "format": "DWCA",
        # Mirrors occurrence search's `speciesKey` filter
        "predicate": {
            "type": "equals",
            "key": "SPECIES_KEY",
            "value": str(key),
        },
    }

    response = requests.post(
        url_endpoint,
        json=payload,
        auth=(GBIF_USER, GBIF_PASS),
    )
    response.raise_for_status()

    download_key = response.text.strip()

    if not download_key:
        raise ValueError("No download key returned")

    return download_key


def get_occurrence_download(
    download_key: str,
    poll_interval: int = 10,
) -> dict:
    if not download_key:
        raise ValueError("ERROR: missing download key")

    url_endpoint = f"{BASE_URL}/{OCCURRENCE_DOWNLOAD_ENDPOINT}/{download_key}"

    while True:
        response = requests.get(url_endpoint)
        response.raise_for_status()

        data = response.json()
        status = data.get("status")

        if status == "SUCCEEDED":
            return data

        if status in {"FAILED", "CANCELLED"}:
            raise RuntimeError(f"GBIF download failed with status: {status}")

        print(f"Download status: {status}")
        time.sleep(poll_interval)


def read_dwca_table(zip_file: zipfile.ZipFile, filename: str) -> pd.DataFrame:
    # DWCA tables are tab-delimited & unquoted, so quotes must not be interpreted.
    # Everything is read as str so nothing is silently coerced (we cast below)
    with zip_file.open(filename) as table_file:
        return pd.read_csv(
            table_file,
            sep="\t",
            quoting=csv.QUOTE_NONE,
            dtype=str,
            low_memory=False,
        )


def get_dataset_publishing_org_key(dataset_key: str) -> str | None:
    # DWCA omits publishingOrgKey, but each dataset record knows its publisher
    url_endpoint = f"{BASE_URL}/{DATASET_ENDPOINT}/{dataset_key}"

    response = requests.get(url_endpoint)
    response.raise_for_status()

    return response.json().get("publishingOrganizationKey")


def build_occurrences_from_dwca(zip_file: zipfile.ZipFile) -> pd.DataFrame:
    # Reshapes DWCA tables to match the occurrence search API's result fields,
    # so that downstream cleaning code sees the same data as before
    names = zip_file.namelist()

    if "occurrence.txt" not in names:
        raise ValueError("ERROR: No occurrence.txt found in GBIF download")

    occurrences_df = read_dwca_table(zip_file, "occurrence.txt")

    # Naming differences (API vs. DWCA)
    occurrences_df = occurrences_df.rename(columns={"projectID": "projectId"})
    occurrences_df["key"] = occurrences_df["gbifID"].astype(int)

    # Cast numeric fields (API returns these as numbers, not strings)
    for field in DWCA_NUMERIC_FIELDS:
        if field in occurrences_df.columns:
            occurrences_df[field] = pd.to_numeric(
                occurrences_df[field], errors="coerce"
            )

    # DWCA omits interpreted country name, but it's derived from countryCode
    unique_codes = occurrences_df["countryCode"].dropna().unique()
    country_mappings = {
        code: convert_ISO_code_to_country(code) for code in unique_codes
    }
    occurrences_df["country"] = occurrences_df["countryCode"].map(country_mappings)

    # DWCA omits publisher key, so look up once per unique dataset
    org_keys = {
        dataset_key: get_dataset_publishing_org_key(dataset_key)
        for dataset_key in occurrences_df["datasetKey"].dropna().unique()
    }
    occurrences_df["publishingOrgKey"] = occurrences_df["datasetKey"].map(org_keys)

    # Nest multimedia rows into a `media` list per occurrence (as API does)
    media_by_id = {}

    if "multimedia.txt" in names:
        multimedia_df = read_dwca_table(zip_file, "multimedia.txt")
        media_fields = [f for f in API_MEDIA_FIELDS if f in multimedia_df.columns]

        for row in multimedia_df[["gbifID"] + media_fields].to_dict("records"):
            gbif_id = row.pop("gbifID")

            # API omits null media fields entirely
            media_by_id.setdefault(gbif_id, []).append(
                {field: val for field, val in row.items() if pd.notna(val)}
            )

    occurrences_df["media"] = occurrences_df["gbifID"].map(
        lambda gbif_id: media_by_id.get(gbif_id, [])
    )

    # Missing values should be None (as in API), not NaN
    occurrences_df = occurrences_df.astype(object).where(occurrences_df.notna(), None)

    return occurrences_df


def download_occurrences_csv(
    download_data: dict,
    output_path: str = GBIF_RAW_CSV,
) -> pd.DataFrame:
    download_url = download_data.get("downloadLink")

    if not download_url:
        raise ValueError("No download link found")

    response = requests.get(download_url)
    response.raise_for_status()

    with zipfile.ZipFile(io.BytesIO(response.content)) as zip_file:
        occurrences_df = build_occurrences_from_dwca(zip_file)

    # Sanity check against what GBIF says it exported
    expected_count = download_data.get("totalRecords")
    if expected_count is not None and expected_count != len(occurrences_df):
        print(
            f"WARNING: GBIF reports {expected_count} records, "
            f"but parsed {len(occurrences_df)}"
        )

    export_to_csv(output_path, occurrences_df)

    return occurrences_df


def get_all_occurrences_raw() -> list:
    download_key = request_occurrence_download()
    print(f"GBIF download requested, with download key: {download_key}")

    download_data = get_occurrence_download(download_key)
    print("GBIF download complete. Exporting to CSV")

    occurrences_df = download_occurrences_csv(download_data)

    return occurrences_df.to_dict("records")


if __name__ == "__main__":
    occurrences_df = get_all_occurrences_raw()
