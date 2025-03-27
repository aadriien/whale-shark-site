###############################################################################
##  `gbif.py`                                                                ##
##                                                                           ##
##  Purpose: Accesses GBIF's API endpoint                                    ##
###############################################################################


import requests

from src.config import (
    COMMON_NAME, SPECIES_NAME,
)

from src.utils.api_utils import (
    prettify_json, find_field,
)


BASE_URL = "https://api.gbif.org/v1"

SPECIES_MATCH_ENDPOINT = "species/match"
OCCURRENCE_SEARCH_ENDPOINT = "occurrence/search"

LIMIT = 200

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
    "media",
    "countryCode", 
    "country", 
    "gbifRegion", 
    "collectionCode", 
    "verbatimLocality", 
    "gbifId", 
    "occurrenceID", 
    "identificationID"
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


if __name__ == "__main__":
    species_key = get_species_key()
    print(species_key)
    print(f"\n\n\n")

    all_occurrences = get_all_occurrences()
    print(prettify_json(all_occurrences[:3]))




