###############################################################################
##  `gbif.py`                                                                ##
##                                                                           ##
##  Purpose: Extracts relevant GBIF data & exports to CSVs                   ##
###############################################################################


import pandas as pd

from src.utils.data_utils import (
    export_to_csv, extract_relevant_fields,
)

from src.fetch.gbif import (
    get_all_occurrences_raw,
)


GBIF_CLEAN_FILE = "data/gbif_clean.csv"
GBIF_MEDIA_CLEAN_FILE = "data/gbif_media_clean.csv"

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
    "organismID",
    "identificationID",
    "media",
]


#####
## Handle API results
#####

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


def get_all_occurrences_clean() -> list:
    cleaned_occurrences = []

    # Returns array of dicts
    raw_occurrences = get_all_occurrences_raw()

    for occurrence in raw_occurrences:
        # Returns list, which we then append
        extracted_data = extract_relevant_fields(occurrence, OCCURRENCE_RESULT_FIELDS)
        cleaned_occurrences.append(extracted_data)

    return cleaned_occurrences


def export_gbif_occurrences() -> pd.DataFrame:
    all_occurrences = get_all_occurrences_clean()

    if not all_occurrences:
        raise ValueError("Error: No occurrences to export")

    occurrences_df = pd.DataFrame(all_occurrences)

    # Media goes in its own separate CSV (since variable per occurrence)
    if "media" in occurrences_df.columns:
        occurrences_df = occurrences_df.drop(columns=["media"])

        all_media_data = extract_media_data(all_occurrences)
        media_df = pd.DataFrame(all_media_data)

        if not media_df.empty:
            export_to_csv(GBIF_MEDIA_CLEAN_FILE, media_df)

    export_to_csv(GBIF_CLEAN_FILE, occurrences_df)
    return occurrences_df




