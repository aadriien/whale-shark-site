###############################################################################
##  `gbif.py`                                                                ##
##                                                                           ##
##  Purpose: Accesses GBIF's API endpoint to query data                      ##
###############################################################################


import requests
import pandas as pd

from src.config import (
    SPECIES_NAME,
)

from src.utils.api_utils import (
    find_field,
)

from src.utils.data_utils import (
    export_to_csv, 
)


GBIF_RAW_FILE = "data/gbif_raw.csv"

BASE_URL = "https://api.gbif.org/v1"

SPECIES_MATCH_ENDPOINT = "species/match"
OCCURRENCE_SEARCH_ENDPOINT = "occurrence/search"

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


def get_all_occurrences_raw() -> list:
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
    export_to_csv(GBIF_RAW_FILE, raw_occurrencess_df)

    return raw_occurrences



if __name__ == "__main__":
    occurrences_df = get_all_occurrences_raw()



