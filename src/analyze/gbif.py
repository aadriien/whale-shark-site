###############################################################################
##  `gbif.py`                                                                ##
##                                                                           ##
##  Purpose: Analyzes [clean] GBIF data                                      ##
###############################################################################


import pandas as pd

from src.config import (
    MONTH_NAMES, 
)

from src.utils.data_utils import (
    read_csv, export_to_csv, validate_and_dropna,
)

from src.clean.gbif import (
    export_gbif_occurrences,
    GBIF_RAW_FILE,
)


GBIF_CALENDAR_STATS_FILE = "outputs/gbif_calendar_stats.csv"
GBIF_COUNTRY_STATS_FILE = "outputs/gbif_country_stats.csv"
GBIF_CONTINENT_STATS_FILE = "outputs/gbif_continent_stats.csv"
GBIF_PUBLISHING_COUNTRY_STATS_FILE = "outputs/gbif_publishingCountry_stats.csv"



#####
## Specific categories to arrange
#####

def add_totals_column(source_df: pd.DataFrame, target_df: pd.DataFrame, groupby: list[str]) -> pd.DataFrame:
    if not isinstance(groupby, list):
        raise ValueError("Error, must specify groupby")

    target_df.loc[:, "Total Occurrences"] = source_df.groupby(groupby).size()
    target_df = target_df[["Total Occurrences"] + 
        [col for col in target_df.columns if col != "Total Occurrences"]]
    
    return target_df



def make_calendar_df(occurrences_df: pd.DataFrame) -> pd.DataFrame:
    df = occurrences_df.copy()

    df.loc[:, "year"] = df["year"].astype(int)
    df.loc[:, "month"] = df["month"].astype(int)

    calendar_counts = df.pivot_table(
        index="year", columns="month", aggfunc="size", fill_value=0
    )
    calendar_counts.columns = MONTH_NAMES

    calendar_counts = add_totals_column(source_df=df, target_df=calendar_counts, groupby=["year"])
    return calendar_counts



def make_sex_df(occurrences_df: pd.DataFrame) -> pd.DataFrame:
    df = occurrences_df.copy()

    # Standardize values for column
    df.loc[:, "sex"] = df["sex"].apply(
        lambda x: x if x in ["Female", "Male"] else "Unknown"
    )

    sex_counts = df.pivot_table(
        index="year", columns="sex", aggfunc="size", fill_value=0
    )
    sex_counts = sex_counts.add_prefix("Sex: ")
    return sex_counts



def make_lifeStage_df(occurrences_df: pd.DataFrame) -> pd.DataFrame:
    df = occurrences_df.copy()

    # Standardize values for column
    df.loc[:, "lifeStage"] = df["lifeStage"].fillna("Unknown")

    life_stage_counts = df.pivot_table(
        index="year", columns="lifeStage", aggfunc="size", fill_value=0
    )
    life_stage_counts = life_stage_counts.add_prefix("Life Stage: ")
    return life_stage_counts



def make_country_df(occurrences_df: pd.DataFrame, index: list[str]) -> pd.DataFrame:
    if not isinstance(index, list):
        raise ValueError("Error, must specify index/indices")

    df = occurrences_df.copy()

    country_counts = df.pivot_table(
        index=index, columns="month", aggfunc="size", fill_value=0
    )
    country_counts.columns = MONTH_NAMES

    country_counts = add_totals_column(source_df=df, target_df=country_counts, groupby=index)
    return country_counts



def make_eventDate_df(occurrences_df: pd.DataFrame, groupby: list[str]) -> pd.DataFrame:
    if not isinstance(groupby, list):
        raise ValueError("Error, must specify groupby")

    df = occurrences_df.copy()

    # Oldest & most recent sightings (take first date if range)
    df.loc[:, "eventDate"] = df["eventDate"].astype(str).str.strip()
    df.loc[:, "eventDate"] = df["eventDate"].str.split("/").str[0]

    date_min_max = df.groupby(groupby)["eventDate"].agg(["min", "max"])

    date_min_max["Oldest Occurrence"] = date_min_max["min"].astype(str).str[:10]
    date_min_max["Newest Occurrence"] = date_min_max["max"].astype(str).str[:10]
    date_min_max.drop(columns=["min", "max"], inplace=True)

    return date_min_max



def make_continent_df(occurrences_df: pd.DataFrame) -> pd.DataFrame:
    df = occurrences_df.copy()

    continent_counts = df.pivot_table(
        index="continent", columns="month", aggfunc="size", fill_value=0
    )
    continent_counts.columns = MONTH_NAMES

    continent_counts = add_totals_column(source_df=df, target_df=continent_counts, groupby=["continent"])
    return continent_counts



def make_basisOfRecord_df(occurrences_df: pd.DataFrame, index: list[str]) -> pd.DataFrame:
    if not isinstance(index, list):
        raise ValueError("Error, must specify index/indices")

    df = occurrences_df.copy()

    # Standardize values for column
    df.loc[:, "basisOfRecord"] = df["basisOfRecord"].apply(
        lambda x: x if x in ["HUMAN_OBSERVATION", "MACHINE_OBSERVATION"] else "Other"
    )

    basisOfRecord_counts = df.pivot_table(
        index=index, columns="basisOfRecord", aggfunc="size", fill_value=0
    )
    basisOfRecord_counts = basisOfRecord_counts.add_prefix("Basis of Record: ")
    return basisOfRecord_counts


def map_codes_to_countries(occurrences_df: pd.DataFrame) -> dict:
    country_mappings = occurrences_df.set_index("countryCode")["country"].to_dict()
    return country_mappings


#####
## Larger datasets to export
#####

def export_calendar_stats(occurrences_df: pd.DataFrame) -> None:
    occurrences_df = validate_and_dropna(occurrences_df, ["year", "month"])

    # Get data for calendar, basisOfRecord, sex, lifeStage
    calendar_counts = make_calendar_df(occurrences_df)
    basisOfRecord_counts = make_basisOfRecord_df(occurrences_df, index=["year"])
    sex_counts = make_sex_df(occurrences_df)
    life_stage_counts = make_lifeStage_df(occurrences_df)

    # Merge DataFrames
    calendar_stats = calendar_counts.merge(basisOfRecord_counts, on="year", how="left")
    calendar_stats = calendar_stats.merge(sex_counts, on="year", how="left")
    calendar_stats = calendar_stats.merge(life_stage_counts, on="year", how="left")

    calendar_stats = calendar_stats.sort_values(by="year", ascending=False).reset_index()
    export_to_csv(GBIF_CALENDAR_STATS_FILE, calendar_stats)



def export_country_stats(occurrences_df: pd.DataFrame) -> None:
    occurrences_df = validate_and_dropna(occurrences_df, ["countryCode", "country", "eventDate"])

    # Get data for country, basisOfRecord, eventDate
    country_counts = make_country_df(occurrences_df, index=["countryCode", "country"])
    basisOfRecord_counts = make_basisOfRecord_df(occurrences_df, index=["countryCode", "country"])
    date_min_max = make_eventDate_df(occurrences_df, groupby=["countryCode", "country"])

    # Merge DataFrames
    country_stats = country_counts.merge(basisOfRecord_counts, on=["countryCode", "country"], how="left")
    country_stats = country_stats.merge(date_min_max, on=["countryCode", "country"], how="left")

    country_stats = country_stats.sort_values(by="country", ascending=True).reset_index()
    export_to_csv(GBIF_COUNTRY_STATS_FILE, country_stats)



def export_continent_stats(occurrences_df: pd.DataFrame) -> None:
    occurrences_df = validate_and_dropna(occurrences_df, ["continent", "eventDate"])

    # Get data for continent, basisOfRecord, eventDate
    continent_counts = make_continent_df(occurrences_df)
    basisOfRecord_counts = make_basisOfRecord_df(occurrences_df, index=["continent"])
    date_min_max = make_eventDate_df(occurrences_df, groupby=["continent"])

    # Merge DataFrames
    continent_stats = continent_counts.merge(basisOfRecord_counts, on=["continent"], how="left")
    continent_stats = continent_stats.merge(date_min_max, on=["continent"], how="left")

    continent_stats = continent_stats.sort_values(by="continent", ascending=True).reset_index()
    export_to_csv(GBIF_CONTINENT_STATS_FILE, continent_stats)



def export_publishingCountry_stats(occurrences_df: pd.DataFrame) -> None:
    # Hold country / codes mappings for later (& before dropping null values)
    country_mappings = map_codes_to_countries(occurrences_df)

    occurrences_df = validate_and_dropna(occurrences_df, ["publishingCountry", "eventDate"])

    # Get data for publishingCountry, basisOfRecord, eventDate
    publishingCountry_counts = make_country_df(occurrences_df, index=["publishingCountry"])
    basisOfRecord_counts = make_basisOfRecord_df(occurrences_df, index=["publishingCountry"])
    date_min_max = make_eventDate_df(occurrences_df, groupby=["publishingCountry"])

    # Merge DataFrames
    publishingCountry_stats = publishingCountry_counts.merge(basisOfRecord_counts, on=["publishingCountry"], how="left")
    publishingCountry_stats = publishingCountry_stats.merge(date_min_max, on=["publishingCountry"], how="left")

    # Format: map countryCode column (index) to get full country name
    publishingCountry_stats = publishingCountry_stats.rename_axis(
        index={"publishingCountry": "countryCode"}
    )
    publishingCountry_stats["publishingCountry"] = publishingCountry_stats.index.map(country_mappings)
    
    publishingCountry_stats = publishingCountry_stats[["publishingCountry"] + 
        [col for col in publishingCountry_stats.columns if col != "publishingCountry"]]

    publishingCountry_stats = publishingCountry_stats.sort_values(
        by="publishingCountry", ascending=True
    ).reset_index()
    
    export_to_csv(GBIF_PUBLISHING_COUNTRY_STATS_FILE, publishingCountry_stats)



if __name__ == "__main__":
    # occurrences_df = export_gbif_occurrences()

    occurrences_df = read_csv(GBIF_RAW_FILE)

    # Use copy to generate specific CSVs (don't modify original DataFrame)
    export_calendar_stats(occurrences_df.copy())
    export_country_stats(occurrences_df.copy())
    export_continent_stats(occurrences_df.copy())
    export_publishingCountry_stats(occurrences_df.copy())




