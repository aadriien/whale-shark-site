###############################################################################
##  `analyze_regions.py`                                                     ##
##                                                                           ##
##  Purpose: Region-based analysis for GBIF data (countries, continents)     ##
###############################################################################


import pandas as pd

from src.config import MONTH_NAMES
from src.utils.data_utils import (
    validate_and_dropna, add_totals_column, add_avg_per_year, 
    add_top_x_metric, standardize_column_vals, export_to_csv,
)
from src.gbif.constants import (
    GBIF_COUNTRY_STATS_CSV,
    GBIF_CONTINENT_STATS_CSV,
    GBIF_PUBLISHING_COUNTRY_STATS_CSV,
)


def make_region_df(occurrences_df: pd.DataFrame, index: list[str]) -> pd.DataFrame:
    if not isinstance(index, list):
        raise ValueError("Error, must specify index/indices")

    df = occurrences_df.copy()

    region_counts = df.pivot_table(
        index=index, columns="month", aggfunc="size", fill_value=0
    )

    # Preserve month order appearance
    region_counts.columns = pd.CategoricalIndex(
        region_counts.columns,
        categories=MONTH_NAMES,
        ordered=True
    )
    region_counts = region_counts.sort_index(axis=1)

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

    # Oldest & most recent sightings 
    date_min_max = df.groupby(groupby)["eventDate"].agg(["min", "max"])

    date_min_max["Oldest Occurrence"] = date_min_max["min"]
    date_min_max["Newest Occurrence"] = date_min_max["max"]
    date_min_max.drop(columns=["min", "max"], inplace=True)

    return date_min_max


def make_basisOfRecord_df(occurrences_df: pd.DataFrame, index: list[str]) -> pd.DataFrame:
    if not isinstance(index, list):
        raise ValueError("Error, must specify index/indices")

    df = occurrences_df.copy()

    df = standardize_column_vals(
        df, col_name="basisOfRecord", 
        valid_vals=["HUMAN_OBSERVATION", "MACHINE_OBSERVATION"], 
        fill_val="Other (e.g. specimen sample)"
    )

    basisOfRecord_counts = df.pivot_table(
        index=index, columns="basisOfRecord", aggfunc="size", fill_value=0
    )
    basisOfRecord_counts.drop("Other (e.g. specimen sample)", axis=1, inplace=True)

    return basisOfRecord_counts


def export_country_stats(occurrences_df: pd.DataFrame,
                        make_year_total_df_func,
                        make_unique_sharks_count_func) -> None:
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

    # Get count of unique sharks (to compare against total occurrences)
    country_stats = make_unique_sharks_count_func(
        source_df=occurrences_df,
        target_df=country_stats,
        groupby=["countryCode", "country"]
    )

    # Get total occurrences per year for that country
    country_year_summary = make_year_total_df_func(
        occurrences_df=occurrences_df,
        groupby=["countryCode", "country"]
    )

    # Merge DataFrames
    country_stats = country_stats.merge(basisOfRecord_counts, on=["countryCode", "country"], how="left")
    country_stats = country_stats.merge(date_min_max, on=["countryCode", "country"], how="left")
    country_stats = country_stats.merge(country_year_summary, on=["countryCode", "country"], how="left")

    country_stats = country_stats.sort_values(by="country", ascending=True).reset_index()
    export_to_csv(GBIF_COUNTRY_STATS_CSV, country_stats)


def export_continent_stats(occurrences_df: pd.DataFrame,
                          make_year_total_df_func,
                          make_unique_sharks_count_func) -> None:
    occurrences_df = validate_and_dropna(occurrences_df, na_subset=["continent", "eventDate"])
    occurrences_df = occurrences_df[occurrences_df["continent"] != "Unknown"]

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

    # Get count of unique sharks (to compare against total occurrences)
    continent_stats = make_unique_sharks_count_func(
        source_df=occurrences_df,
        target_df=continent_stats,
        groupby=["continent"]
    )

    # Get total occurrences per year for that continent
    continent_year_summary = make_year_total_df_func(
        occurrences_df=occurrences_df,
        groupby=["continent"]
    )

    # Merge DataFrames
    continent_stats = continent_stats.merge(basisOfRecord_counts, on=["continent"], how="left")
    continent_stats = continent_stats.merge(date_min_max, on=["continent"], how="left")
    continent_stats = continent_stats.merge(continent_year_summary, on=["continent"], how="left")

    continent_stats = continent_stats.sort_values(by="continent", ascending=True).reset_index()
    export_to_csv(GBIF_CONTINENT_STATS_CSV, continent_stats)


def export_publishingCountry_stats(occurrences_df: pd.DataFrame,
                                  make_year_total_df_func,
                                  make_unique_sharks_count_func) -> None:
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

    # Get count of unique sharks (to compare against total occurrences)
    publishingCountry_stats = make_unique_sharks_count_func(
        source_df=occurrences_df,
        target_df=publishingCountry_stats,
        groupby=["publishingCountryCode", "publishingCountry"]
    )

    # Get total occurrences per year for that publishingCountry
    publishingCountry_year_summary = make_year_total_df_func(
        occurrences_df=occurrences_df,
        groupby=["publishingCountryCode", "publishingCountry"]
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

    publishingCountry_stats = publishingCountry_stats.merge(
        publishingCountry_year_summary, 
        on=["publishingCountryCode", "publishingCountry"], 
        how="left"
    )

    publishingCountry_stats = publishingCountry_stats.sort_values(
        by="publishingCountry", ascending=True
    ).reset_index()

    export_to_csv(GBIF_PUBLISHING_COUNTRY_STATS_CSV, publishingCountry_stats)
    

