###############################################################################
##  `gbif.py`                                                                ##
##                                                                           ##
##  Purpose: Extracts relevant GBIF data & exports to CSVs                   ##
###############################################################################


import pandas as pd

from src.config import (
    MONTH_NAMES,
    convert_ISO_code_to_country, convert_country_to_continent,
)

from src.utils.data_utils import (
    export_to_csv, extract_relevant_fields, move_column_after, standardize_column_vals,
)

from src.fetch.gbif import (
    get_all_occurrences_raw,
)


GBIF_CLEAN_CSV = "data/gbif_clean.csv"
GBIF_MEDIA_CSV = "data/gbif_media.csv"

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
    "occurrenceRemarks",
    "projectId",
    "recordedBy",
    "identifiedBy",
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


def get_all_extracted_occurrences() -> list:
    extracted_occurrences = []

    # Returns array of dicts (also exports raw dataset in process)
    raw_occurrences = get_all_occurrences_raw()

    for occurrence in raw_occurrences:
        # Returns list, which we then append
        extracted_data = extract_relevant_fields(occurrence, OCCURRENCE_RESULT_FIELDS)
        extracted_occurrences.append(extracted_data)

    return extracted_occurrences


def export_gbif_occurrences() -> pd.DataFrame:
    all_occurrences = get_all_extracted_occurrences()

    if not all_occurrences:
        raise ValueError("Error: No occurrences to export")

    occurrences_df = pd.DataFrame(all_occurrences)
    
    # Convert any unhashable types (lists, dicts) to strings for duplicate detection
    for col in occurrences_df.columns:
        if occurrences_df[col].apply(lambda x: isinstance(x, (list, dict))).any():
            occurrences_df[col] = occurrences_df[col].astype(str)
    
    occurrences_df = refactor_field_values(occurrences_df)

    print(
        "Number of duplicate rows to drop (all columns):",
        occurrences_df.duplicated().sum()
    )
    occurrences_df.drop_duplicates(inplace=True)

    # Media goes in its own separate CSV (since variable per occurrence)
    if "media" in occurrences_df.columns:
        occurrences_df = occurrences_df.drop(columns=["media"])

        all_media_data = extract_media_data(all_occurrences)
        media_df = pd.DataFrame(all_media_data)

        if not media_df.empty:
            export_to_csv(GBIF_MEDIA_CSV, media_df)

    export_to_csv(GBIF_CLEAN_CSV, occurrences_df)
    return occurrences_df


#####
## Format & standardize DataFrames
#####

def format_continents(occurrences_df: pd.DataFrame) -> pd.DataFrame:
    if not isinstance(occurrences_df, pd.DataFrame):
        raise ValueError("Error, must specify occurrences_df")

    def standardize_continent(row: pd.Series) -> str:
        raw_continent = (row.get("continent") or "").strip()

        if raw_continent:
            # Standardize (e.g. NORTH_AMERICA -> North America)
            clean = raw_continent.replace("_", " ").title()
            return clean

        # Step 2: Try using the 'country' field
        country = (row.get("country") or "").strip()
        if country:
            return convert_country_to_continent(country)

        return "Unknown"

    occurrences_df["continent"] = occurrences_df.apply(standardize_continent, axis=1)
    return occurrences_df

    
def map_codes_to_countries(occurrences_df: pd.DataFrame, code_column: str) -> dict:
    if not isinstance(code_column, str):
        raise ValueError("Error, must specify code_column")

    # Get unique codes in occurrences, then populate map via country_converter
    unique_codes = occurrences_df[code_column].dropna().unique()
    country_mappings = {code: convert_ISO_code_to_country(code) for code in unique_codes}

    return country_mappings


def format_country_names(occurrences_df: pd.DataFrame) -> pd.DataFrame:
    if not isinstance(occurrences_df, pd.DataFrame):
        raise ValueError("Error, must specify occurrences_df")

    country_mappings = map_codes_to_countries(occurrences_df, code_column="countryCode")
    occurrences_df["country"] = occurrences_df["countryCode"].replace(country_mappings)

    return occurrences_df

    
def format_publishingCountry(occurrences_df: pd.DataFrame) -> pd.DataFrame:
    if not isinstance(occurrences_df, pd.DataFrame):
        raise ValueError("Error, must specify occurrences_df")

    occurrences_df.rename(
        columns={"publishingCountry": "publishingCountryCode"}, 
        inplace=True
    )
    country_mappings = map_codes_to_countries(occurrences_df, code_column="publishingCountryCode")

    occurrences_df["publishingCountry"] = (
        occurrences_df["publishingCountryCode"].replace(country_mappings)
    )
    occurrences_df = move_column_after(
        occurrences_df, 
        col_to_move="publishingCountry", 
        after_col="publishingCountryCode"
    )

    return occurrences_df


def format_year_month_day(occurrences_df: pd.DataFrame) -> pd.DataFrame:
    if not isinstance(occurrences_df, pd.DataFrame):
        raise ValueError("Error, must specify occurrences_df")

    calendar_fields = ["year", "month", "day"]

    # Strip '.0' from str (e.g. 2025.0 -> 2025)
    for field in calendar_fields:
        occurrences_df[field] = (
            occurrences_df[field]
            .astype(str)
            .str.replace(r"\.0$", "", regex=True)
        )

    occurrences_df.loc[:, "month"] = occurrences_df["month"].map(
        lambda x: MONTH_NAMES[int(x) - 1] if x.isdigit() else None
    )

    # Remove time extra from eventDate (+ take first date if range)
    occurrences_df.loc[:, "eventDate"] = occurrences_df["eventDate"].apply(
        lambda x: str(x).strip().split("/")[0][:10] if pd.notnull(x) else None
    )

    return occurrences_df


def format_sex_lifeStage(occurrences_df: pd.DataFrame) -> pd.DataFrame:
    # Whale shark recorded sex
    occurrences_df = standardize_column_vals(
        occurrences_df, col_name="sex", 
        valid_vals=["Female", "Male"], 
        fill_val="Unknown"
    )

    # Whale shark recorded lifeStage
    occurrences_df.loc[:, "lifeStage"] = occurrences_df["lifeStage"].fillna("Unknown")

    return occurrences_df


def format_individual_shark_IDs(occurrences_df: pd.DataFrame) -> pd.DataFrame:
    # Work with copy to satisfy pandas DataFrame slice concerns
    df = occurrences_df.copy()

    # Split entries with multiple IDs (multiple sharks) into separate rows
    df["organismID"] = df["organismID"].fillna("").astype(str).str.split(';')
    df = df.explode("organismID")

    # Remove any spaces or weird formatting chars, e.g. "{"
    df["organismID"] = df["organismID"].str.replace(r"[{} ]", "", regex=True)

    # Repeat with identificationID field (just to be safe)
    df["identificationID"] = df["identificationID"].fillna("").astype(str).str.split(';')
    df = df.explode("identificationID")
    df["identificationID"] = df["identificationID"].str.replace(r"[{} ]", "", regex=True)

    # Consolidate organismID / identificationID into 1 column (whaleSharkID)
    df["whaleSharkID"] = df["organismID"].combine_first(df["identificationID"])
    df = move_column_after(df, col_to_move="whaleSharkID", after_col="identificationID")

    df = df.reset_index(drop=True)
    return df
    

def refactor_field_values(occurrences_df: pd.DataFrame) -> pd.DataFrame:
    if not isinstance(occurrences_df, pd.DataFrame):
        raise ValueError("Error, must specify occurrences_df")

    occurrences_df = format_continents(occurrences_df)
    
    occurrences_df = format_country_names(occurrences_df)
    occurrences_df = format_publishingCountry(occurrences_df)
    
    occurrences_df = format_year_month_day(occurrences_df)
    occurrences_df = format_sex_lifeStage(occurrences_df)

    occurrences_df = format_individual_shark_IDs(occurrences_df)
    
    return occurrences_df



if __name__ == "__main__":
    occurrences_df = export_gbif_occurrences()

 

