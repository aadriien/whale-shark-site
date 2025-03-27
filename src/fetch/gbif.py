###############################################################################
##  `gbif.py`                                                                ##
##                                                                           ##
##  Purpose: Accesses GBIF's API endpoint                                    ##
###############################################################################


import requests

from src.config import (
    COMMON_NAME, SPECIES_NAME
)


BASE_URL = "https://api.gbif.org/v1"
SPECIES_MATCH_ENDPOINT = "species/match"


def get_species_key(name: str = SPECIES_NAME) -> int:
    url_endpoint = f"{BASE_URL}/{SPECIES_MATCH_ENDPOINT}"
    params = {"scientificName": name}

    response = requests.get(url_endpoint, params=params)
    response.raise_for_status()

    data = response.json()
    species_key = data["speciesKey"]

    if not species_key:
        raise ValueError(f"No species key found for '{name}'")
    return species_key


if __name__ == "__main__":
    species_key = get_species_key()
    print(species_key)




