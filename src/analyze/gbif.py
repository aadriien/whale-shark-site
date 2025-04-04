###############################################################################
##  `gbif.py`                                                                ##
##                                                                           ##
##  Purpose: Analyzes [clean] GBIF data                                      ##
###############################################################################


import pandas as pd
from typing import Optional


from src.config import (
    MONTH_NAMES, 
)

from src.utils.data_utils import (
    read_csv, export_to_csv, validate_and_dropna, move_columns, move_column_after, 
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

    target_df["Total Occurrences"] = target_df.index.map(source_df.groupby(groupby).size())
    target_df = move_columns(target_df, cols_to_move=["Total Occurrences"], position="front")
    
    return target_df



def get_str_with_year_range(full_str: str,
                            after_year: Optional[int] = None, 
                            before_year: Optional[int] = None) -> str:
    if not isinstance(full_str, str):
        raise ValueError("Error, must specify full_str")

    if after_year and before_year:
        full_str += f" ({after_year} - {before_year})"

    elif after_year:
        full_str += f" (after {after_year})"

    elif before_year:
        full_str += f" (before {before_year})"

    else: full_str += " (all)"                        
    
    return full_str



def add_avg_per_year(source_df: pd.DataFrame, 
                    target_df: pd.DataFrame, 
                    groupby: list[str],
                    after_year: Optional[int] = None,
                    before_year: Optional[int] = None) -> pd.DataFrame:
    if not isinstance(groupby, list):
        raise ValueError("Error, must specify groupby")

    source_df = validate_and_dropna(source_df, na_subset=["year"])

    column_name_base = "Avg Per Year"
    column_name = get_str_with_year_range(
        column_name_base, 
        after_year=after_year, 
        before_year=before_year
    )

    if after_year and before_year:
        source_df = source_df[source_df["year"].between(after_year, before_year)]
    elif after_year:
        source_df = source_df[source_df["year"] > after_year]
    elif before_year:
        source_df = source_df[source_df["year"] < before_year]

    # Get total occurrences per [{metric}, year] grouping, then average
    yearly_counts = source_df.groupby(groupby + ["year"]).size()
    avg_per_year = yearly_counts.groupby(groupby).mean().round(2)

    target_df[column_name] = target_df.index.map(avg_per_year)
    target_df = move_columns(target_df, cols_to_move=[column_name], position="front")
    
    return target_df



def add_top_x_metric(occurrences_df: pd.DataFrame, 
                    target_df: pd.DataFrame,
                    groupby: list[str],
                    top_x: int,
                    metric: str,
                    column_name: str) -> pd.DataFrame:
    if not isinstance(groupby, list):
        raise ValueError("Error, must specify groupby")
    if not isinstance(top_x, int):
        raise ValueError("Error, must specify top_x")
    if not isinstance(metric, str):
        raise ValueError("Error, must specify metric")
    if not isinstance(column_name, str):
        raise ValueError("Error, must specify column_name")

    top_metric = (
        occurrences_df.groupby(groupby + [metric])
        .size()
        .reset_index(name="count")
        .sort_values(groupby + ["count"], ascending=[True] * len(groupby) + [False])
    )

    # Keep only top {x} {metric} per {category}
    # e.g. top 3 countries / regions visited by publishingCountry
    top_metric["rank"] = (
        top_metric.groupby(groupby)["count"]
        .rank(method="first", ascending=False)
    )
    top_metric = top_metric[top_metric["rank"] <= top_x].drop(columns=["rank", "count"])

    # Convert to single column format (countries separated by commas)
    top_metric = (
        top_metric.groupby(groupby)[metric]
        .apply(lambda x: " > ".join(x.tolist()))
    )
    target_df[column_name] = target_df.index.get_level_values(groupby[0]).map(top_metric)

    target_df = move_column_after(
        target_df, 
        col_to_move=column_name, 
        after_col="Total Occurrences"
    )

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

    # Standardize values for column
    df.loc[:, "basisOfRecord"] = df["basisOfRecord"].apply(
        lambda x: x if x in ["HUMAN_OBSERVATION", "MACHINE_OBSERVATION"] else "Other"
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
    occurrences_df = validate_and_dropna(occurrences_df, ["continent", "eventDate"])

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
        ["publishingCountryCode", "publishingCountry", "eventDate"]
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



if __name__ == "__main__":
    occurrences_df = read_csv(GBIF_RAW_FILE)

    # Use copy to generate specific CSVs (don't modify original DataFrame)
    export_calendar_stats(occurrences_df.copy())
    export_country_stats(occurrences_df.copy())
    export_continent_stats(occurrences_df.copy())
    export_publishingCountry_stats(occurrences_df.copy())




