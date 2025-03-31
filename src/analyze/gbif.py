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
    read_csv, export_to_csv, 
)

from src.clean.gbif import (
    export_gbif_occurrences,
    GBIF_CLEAN_FILE,
)


GBIF_CALENDAR_STATS_FILE = "outputs/gbif_calendar_stats.csv"
GBIF_COUNTRY_STATS_FILE = "outputs/gbif_country_stats.csv"


def export_calendar_stats(occurrences_df: pd.DataFrame) -> None:
    if occurrences_df is None or not isinstance(occurrences_df, pd.DataFrame):
        raise ValueError("Error, must specify a valid DataFrame to export")

    occurrences_df = occurrences_df.dropna(subset=["year", "month"])

    occurrences_df.loc[:, "year"] = occurrences_df["year"].astype(int)
    occurrences_df.loc[:, "month"] = occurrences_df["month"].astype(int)

    # Restructure data into pivot table (high-level summary)
    calendar_stats = occurrences_df.pivot_table(
        index="year", columns="month", aggfunc="size", fill_value=0
    )
    calendar_stats.columns = MONTH_NAMES

    # Total for each year
    calendar_stats.loc[:, "Total Occurrences"] = calendar_stats.sum(axis=1)
    calendar_stats = calendar_stats[["Total Occurrences"] + [col for col in calendar_stats.columns if col != "Total Occurrences"]]

    # Standardize sex & life stage
    occurrences_df.loc[:, "sex"] = occurrences_df["sex"].apply(
        lambda x: x if x in ["Female", "Male"] else "Unknown"
    )
    occurrences_df.loc[:, "lifeStage"] = occurrences_df["lifeStage"].fillna("Unknown")

    # Count by sex identified per year
    sex_counts = occurrences_df.pivot_table(
        index="year", columns="sex", aggfunc="size", fill_value=0
    )
    sex_counts = sex_counts.add_prefix("Sex: ")
    calendar_stats = calendar_stats.merge(sex_counts, on="year", how="left")

    # Count by life stage identified per year
    life_stage_counts = occurrences_df.pivot_table(
        index="year", columns="lifeStage", aggfunc="size", fill_value=0
    )
    life_stage_counts = life_stage_counts.add_prefix("Life Stage: ")
    calendar_stats = calendar_stats.merge(life_stage_counts, on="year", how="left")

    calendar_stats = calendar_stats.sort_values(by="year", ascending=False)
    calendar_stats.reset_index(inplace=True)

    export_to_csv(GBIF_CALENDAR_STATS_FILE, calendar_stats)


def export_country_stats(occurrences_df: pd.DataFrame) -> None:
    if occurrences_df is None or not isinstance(occurrences_df, pd.DataFrame):
        raise ValueError("Error, must specify a valid DataFrame to export")

    occurrences_df = occurrences_df.dropna(subset=["countryCode", "country"])

    # Restructure data into pivot table (high-level summary)
    country_stats = occurrences_df.pivot_table(
        index=["countryCode", "country"], columns="month", aggfunc="size", fill_value=0
    )
    country_stats.columns = MONTH_NAMES

    # Total for each year
    country_stats.loc[:, "Total Occurrences"] = country_stats.sum(axis=1)
    country_stats = country_stats[["Total Occurrences"] + [col for col in country_stats.columns if col != "Total Occurrences"]]

    country_stats = country_stats.sort_values(by="country", ascending=True)
    country_stats.reset_index(inplace=True)

    export_to_csv(GBIF_COUNTRY_STATS_FILE, country_stats)



if __name__ == "__main__":
    # occurrences_df = export_gbif_occurrences()

    occurrences_df = read_csv(GBIF_CLEAN_FILE)

    # Use copy to generate specific CSVs (don't modify original DataFrame)
    export_calendar_stats(occurrences_df.copy())
    export_country_stats(occurrences_df.copy())


