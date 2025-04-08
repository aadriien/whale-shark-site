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
    read_csv, export_to_csv, validate_and_dropna, standardize_column_vals,
    add_totals_column, add_avg_per_year, add_top_x_metric,
)

from src.clean.gbif import (
    GBIF_CLEAN_FILE,
)


GBIF_CALENDAR_STATS_FILE = "outputs/gbif_calendar_stats.csv"
GBIF_COUNTRY_STATS_FILE = "outputs/gbif_country_stats.csv"
GBIF_CONTINENT_STATS_FILE = "outputs/gbif_continent_stats.csv"
GBIF_PUBLISHING_COUNTRY_STATS_FILE = "outputs/gbif_publishingCountry_stats.csv"
GBIF_INDIVIDUAL_SHARKS_STATS_FILE = "outputs/gbif_individual_sharks_stats.csv"



#####
## Specific categories / DataFrames to build
#####

def make_calendar_df(occurrences_df: pd.DataFrame) -> pd.DataFrame:
    df = occurrences_df.copy()

    calendar_counts = df.pivot_table(
        index="year", columns="month", aggfunc="size", fill_value=0
    )
    calendar_counts.columns = MONTH_NAMES

    calendar_counts = add_totals_column(source_df=df, target_df=calendar_counts, groupby=["year"])
    return calendar_counts


def make_sex_df(occurrences_df: pd.DataFrame) -> pd.DataFrame:
    df = occurrences_df.copy()

    sex_counts = df.pivot_table(
        index="year", columns="sex", aggfunc="size", fill_value=0
    )
    sex_counts = sex_counts.add_prefix("Sex: ")
    return sex_counts


def make_lifeStage_df(occurrences_df: pd.DataFrame) -> pd.DataFrame:
    df = occurrences_df.copy()

    life_stage_counts = df.pivot_table(
        index="year", columns="lifeStage", aggfunc="size", fill_value=0
    )
    life_stage_counts = life_stage_counts.add_prefix("Life Stage: ")
    return life_stage_counts


def make_region_df(occurrences_df: pd.DataFrame, index: list[str]) -> pd.DataFrame:
    if not isinstance(index, list):
        raise ValueError("Error, must specify index/indices")

    df = occurrences_df.copy()

    region_counts = df.pivot_table(
        index=index, columns="month", aggfunc="size", fill_value=0
    )
    region_counts.columns = MONTH_NAMES

    region_counts = add_avg_per_year(
        source_df=df, target_df=region_counts, groupby=index, 
        before_year=2000
    )
    region_counts = add_avg_per_year(
        source_df=df, target_df=region_counts, groupby=index, 
        after_year=2000, before_year=2010
    )
    region_counts = add_avg_per_year(
        source_df=df, target_df=region_counts, groupby=index, 
        after_year=2010, before_year=2020
    )
    region_counts = add_avg_per_year(
        source_df=df, target_df=region_counts, groupby=index, 
        after_year=2020
    )
    
    region_counts = add_avg_per_year(source_df=df, target_df=region_counts, groupby=index)
    region_counts = add_totals_column(source_df=df, target_df=region_counts, groupby=index)

    return region_counts


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


def make_basisOfRecord_df(occurrences_df: pd.DataFrame, index: list[str]) -> pd.DataFrame:
    if not isinstance(index, list):
        raise ValueError("Error, must specify index/indices")

    df = occurrences_df.copy()

    df = standardize_column_vals(
        df, col_name="basisOfRecord", 
        valid_vals=["HUMAN_OBSERVATION", "MACHINE_OBSERVATION"], 
        fill_val="Other"
    )

    basisOfRecord_counts = df.pivot_table(
        index=index, columns="basisOfRecord", aggfunc="size", fill_value=0
    )
    basisOfRecord_counts = basisOfRecord_counts.add_prefix("Basis of Record: ")
    return basisOfRecord_counts


#####
## Larger datasets to export
#####

def export_calendar_stats(occurrences_df: pd.DataFrame) -> None:
    # Copy after dropping null so pandas doesn't warn about df.loc[:,] vs df[]
    occurrences_df = validate_and_dropna(occurrences_df, ["year", "month"])

    # Get data for calendar, basisOfRecord, sex, lifeStage
    calendar_counts = make_calendar_df(occurrences_df)
    basisOfRecord_counts = make_basisOfRecord_df(occurrences_df, index=["year"])
    sex_counts = make_sex_df(occurrences_df)
    life_stage_counts = make_lifeStage_df(occurrences_df)

    # Get top 3 publishing countries per year
    calendar_stats = add_top_x_metric(
        occurrences_df, calendar_counts, 
        groupby=["year"],
        top_x=3,
        metric="publishingCountry",
        column_name="Top 3 Publishing Countries"
    )

    # Merge DataFrames
    calendar_stats = calendar_counts.merge(basisOfRecord_counts, on="year", how="left")
    calendar_stats = calendar_stats.merge(sex_counts, on="year", how="left")
    calendar_stats = calendar_stats.merge(life_stage_counts, on="year", how="left")

    calendar_stats = calendar_stats.sort_values(by="year", ascending=False).reset_index()
    export_to_csv(GBIF_CALENDAR_STATS_FILE, calendar_stats)


def export_country_stats(occurrences_df: pd.DataFrame) -> None:
    occurrences_df = validate_and_dropna(occurrences_df, na_subset=["countryCode", "country", "eventDate"])

    # Get data for country, basisOfRecord, eventDate
    country_counts = make_region_df(occurrences_df, index=["countryCode", "country"])
    basisOfRecord_counts = make_basisOfRecord_df(occurrences_df, index=["countryCode", "country"])
    date_min_max = make_eventDate_df(occurrences_df, groupby=["countryCode", "country"])

    # Get top 3 publishing countries per country
    country_stats = add_top_x_metric(
        occurrences_df, country_counts, 
        groupby=["country"],
        top_x=3,
        metric="publishingCountry",
        column_name="Top 3 Publishing Countries"
    )

    # Merge DataFrames
    country_stats = country_stats.merge(basisOfRecord_counts, on=["countryCode", "country"], how="left")
    country_stats = country_stats.merge(date_min_max, on=["countryCode", "country"], how="left")

    country_stats = country_stats.sort_values(by="country", ascending=True).reset_index()
    export_to_csv(GBIF_COUNTRY_STATS_FILE, country_stats)


def export_continent_stats(occurrences_df: pd.DataFrame) -> None:
    occurrences_df = validate_and_dropna(occurrences_df, na_subset=["continent", "eventDate"])

    # Get data for continent, basisOfRecord, eventDate
    continent_counts = make_region_df(occurrences_df, index=["continent"])
    basisOfRecord_counts = make_basisOfRecord_df(occurrences_df, index=["continent"])
    date_min_max = make_eventDate_df(occurrences_df, groupby=["continent"])

    # Get top 3 publishing countries per continent
    continent_stats = add_top_x_metric(
        occurrences_df, continent_counts, 
        groupby=["continent"],
        top_x=3,
        metric="publishingCountry",
        column_name="Top 3 Publishing Countries"
    )

    # Merge DataFrames
    continent_stats = continent_stats.merge(basisOfRecord_counts, on=["continent"], how="left")
    continent_stats = continent_stats.merge(date_min_max, on=["continent"], how="left")

    continent_stats = continent_stats.sort_values(by="continent", ascending=True).reset_index()
    export_to_csv(GBIF_CONTINENT_STATS_FILE, continent_stats)


def export_publishingCountry_stats(occurrences_df: pd.DataFrame) -> None:
    occurrences_df = validate_and_dropna(
        occurrences_df, 
        na_subset=["publishingCountryCode", "publishingCountry", "eventDate"]
    )

    # Get data for publishingCountry, basisOfRecord, eventDate
    publishingCountry_counts = make_region_df(
        occurrences_df, index=["publishingCountryCode", "publishingCountry"]
    )
    basisOfRecord_counts = make_basisOfRecord_df(
        occurrences_df, index=["publishingCountryCode", "publishingCountry"]
    )
    date_min_max = make_eventDate_df(
        occurrences_df, groupby=["publishingCountryCode", "publishingCountry"]
    )

    # Get top 3 visited / surveyed countries per publishingCountry
    publishingCountry_stats = add_top_x_metric(
        occurrences_df, publishingCountry_counts, 
        groupby=["publishingCountry"],
        top_x=3,
        metric="country",
        column_name="Top 3 Countries Visited"
    )

    # Merge DataFrames
    publishingCountry_stats = publishingCountry_stats.merge(
        basisOfRecord_counts, 
        on=["publishingCountryCode", "publishingCountry"], 
        how="left"
    )
    publishingCountry_stats = publishingCountry_stats.merge(
        date_min_max, 
        on=["publishingCountryCode", "publishingCountry"], 
        how="left"
    )

    publishingCountry_stats = publishingCountry_stats.sort_values(
        by="publishingCountry", ascending=True
    ).reset_index()

    export_to_csv(GBIF_PUBLISHING_COUNTRY_STATS_FILE, publishingCountry_stats)




#####
## Tracing individual whale sharks over time & space
##
## We want to know:
##
##  - ID (organismID and/or identificationID)
##  - sex (if available)
##  - lifeStage (if available, as of given year)
##      - store/display as str from list, e.g. "Juvenile (2019), Adult (2024)"
##  - all sightings/occurrences (by key/ID, to map for further info)
##      - store list of all corresponding keys from full GBIF clean dataset
##      - can also store occurrenceIDs if desired BUT they're not all uniform
##  - all countries visited by year
##      - store as str from list... 
##          - example 1: "Ecuador (2016)" 
##          - example 2: "Mexico (2018)"
##  - all specific places (stateProvince, verbatimLocality) by month + year
##      - again, represent as str from list...
##          - example 1: "Cebu - Philippines (July 2017)" 
##          - example 2: "Baja California Sur - La Paz, MX-BS, MX (Aug 2021)"
##  - all explicit coordinates (decimalLatitude, decimalLongitude) by eventDate
##      - roughly the same representation...
##          - example 1: "-34.996 lat, 150.829 long (2025-01-03)" 
##          - example 2: "24.178 lat, -110.416 long (2025-01-05)"
##
#####


def export_individual_shark_stats(occurrences_df: pd.DataFrame) -> None:
    # Use how="all" to allow either organismID or identificationID
    occurrences_df = validate_and_dropna(
        occurrences_df, 
        na_subset=["organismID", "identificationID"], 
        how="all"
    )
    sharks_all_data = occurrences_df.drop_duplicates(subset=["organismID", "identificationID"]).copy()

    # Consolidate organismID / identificationID into 1 column (whaleSharkID)
    sharks_all_data["whaleSharkID"] = (
        sharks_all_data["organismID"].combine_first(sharks_all_data["identificationID"])
    )

    # Now focus on clean entries & map info (sex, lifeStage, etc) where available
    individual_sharks = sharks_all_data[["whaleSharkID"]].reset_index(drop=True)

    sex_mappings = (
        sharks_all_data[sharks_all_data["sex"].isin(["Female", "Male"])] 
        .drop_duplicates(subset="whaleSharkID", keep="first") 
        [["whaleSharkID", "sex"]] 
    )
    individual_sharks = individual_sharks.merge(sex_mappings, on="whaleSharkID", how="left")
    individual_sharks.loc[:, "sex"] = individual_sharks["sex"].fillna("Unknown")


    export_to_csv(GBIF_INDIVIDUAL_SHARKS_STATS_FILE, individual_sharks)

    return






def export_all_analyses(dataframe: pd.DataFrame) -> None:
    # Use copy to generate specific CSVs (don't modify original DataFrame)
    occurrences_df = dataframe.copy()

    export_calendar_stats(occurrences_df)

    export_country_stats(occurrences_df)
    export_continent_stats(occurrences_df)
    export_publishingCountry_stats(occurrences_df)

    export_individual_shark_stats(occurrences_df)



if __name__ == "__main__":
    occurrences_df = read_csv(
        GBIF_CLEAN_FILE, 
        dtype={"year": "Int64", "month": "Int64", "day": "Int64"}
    )
    export_all_analyses(occurrences_df)
    




