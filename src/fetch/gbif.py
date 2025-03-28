###############################################################################
##  `gbif.py`                                                                ##
##                                                                           ##
##  Purpose: Accesses GBIF's API endpoint                                    ##
###############################################################################


import requests
import pandas as pd

from src.config import (
    COMMON_NAME, SPECIES_NAME,
)

from src.utils.api_utils import (
    prettify_json, find_field,
)

from src.utils.data_utils import (
    export_to_csv,
)


BASE_URL = "https://api.gbif.org/v1"

SPECIES_MATCH_ENDPOINT = "species/match"
OCCURRENCE_SEARCH_ENDPOINT = "occurrence/search"

LIMIT = 200

GBIF_RAW_FILE = "data/gbif_raw.csv"
GBIF_MEDIA_RAW_FILE = "data/gbif_media_raw.csv"


OCCURRENCE_RESULT_FIELDS = [
    "key", 
    "datasetKey", 
    "publishingOrgKey", 
    "publishingCountry", 
    "basisOfRecord", 
    "sex", 
    "lifeStage", 
    "dateIdentified", 
    "decimalLatitude", 
    "decimalLongitude", 
    "coordinateUncertaintyInMeters", 
    "continent", 
    "stateProvince", 
    "year", 
    "month", 
    "day", 
    "eventDate", 
    "countryCode", 
    "country", 
    "gbifRegion", 
    "collectionCode", 
    "verbatimLocality", 
    "occurrenceID", 
    "identificationID",
    "media",
]


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


def get_occurrence_search(offset: int,
                            limit: int = LIMIT,
                            name: str = SPECIES_NAME, 
                            key: int = get_species_key()
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


def extract_occurrence_fields(data: dict) -> dict:
    if not data:
        raise ValueError("ERROR: missing data")

    if not isinstance(data, dict):
        raise ValueError("ERROR: data must be a dict")

    extracted_data = {field: find_field(data, field) for field in OCCURRENCE_RESULT_FIELDS}
    return extracted_data


def get_all_occurrences() -> list:
    cleaned_occurrences = []
    offset = 0

    while True:
        raw_data = get_occurrence_search(offset)

        for occurrence in raw_data["results"]:
            extracted_data = extract_occurrence_fields(occurrence)
            cleaned_occurrences.append(extracted_data)

        # Stop if fetched all records
        if offset + LIMIT >= raw_data.get("count", 0):
            break  
        
        offset += LIMIT

    return cleaned_occurrences


def extract_media_data(occurrences: list) -> list:
    media_data = []

    for occurrence in occurrences:
        occurrence_key = occurrence.get("key", "Unknown")  
        occurrence_id = occurrence.get("occurrenceID", "Unknown") 
        identification_id = occurrence.get("identificationID", "Unknown") 
        
        # Check if media exists for this occurrence
        if "media" in occurrence:
            for media_item in occurrence["media"]:
                # Flatten media dict & create 1 row for each entry 
                media_row = {
                    "key": occurrence_key,
                    "occurrenceID": occurrence_id,
                    "identificationID": identification_id,
                    **media_item  # Include all media fields as separate columns
                }
                media_data.append(media_row)

    return media_data


def export_gbif_occurrences() -> None:
    all_occurrences = get_all_occurrences()

    if not all_occurrences:
        raise ValueError("Error: No occurrences to export")

    occurrences_df = pd.DataFrame(all_occurrences)

    # Media goes in its own separate CSV (since variable per occurrence)
    if "media" in occurrences_df.columns:
        occurrences_df = occurrences_df.drop(columns=["media"])

        all_media_data = extract_media_data(all_occurrences)
        media_df = pd.DataFrame(all_media_data)

        if not media_df.empty:
            export_to_csv(GBIF_MEDIA_RAW_FILE, media_df)

    export_to_csv(GBIF_RAW_FILE, occurrences_df)


if __name__ == "__main__":
    export_gbif_occurrences()





