###############################################################################
##  `analyze_time.py`                                                        ##
##                                                                           ##
##  Purpose: Time-based analysis for GBIF data (calendar, year stats)        ##
###############################################################################


import pandas as pd

from src.config import MONTH_NAMES
from src.utils.data_utils import (
    validate_and_dropna, add_totals_column, add_top_x_metric,
)
from src.gbif.constants import GBIF_CALENDAR_STATS_CSV
from src.utils.data_utils import export_to_csv


def make_calendar_df(occurrences_df: pd.DataFrame) -> pd.DataFrame:
    df = occurrences_df.copy()

    calendar_counts = df.pivot_table(
        index="year", columns="month", aggfunc="size", fill_value=0
    )

    # Preserve month order appearance
    calendar_counts.columns = pd.CategoricalIndex(
        calendar_counts.columns,
        categories=MONTH_NAMES,
        ordered=True
    )
    calendar_counts = calendar_counts.sort_index(axis=1)

    calendar_counts = add_totals_column(source_df=df, target_df=calendar_counts, groupby=["year"])
    return calendar_counts


def make_year_total_df(occurrences_df: pd.DataFrame, groupby: list[str]) -> pd.DataFrame:
    occurrences_df = occurrences_df.dropna(subset=["year"])
    counts = occurrences_df.groupby(groupby + ["year"]).size().reset_index(name="count")

    # Get str of total counts per year for given metric, e.g. "56 (2017), 39 (2021)"
    year_counts = (
        counts.sort_values("year")
            .groupby(groupby)
            .apply(lambda x: ", ".join(
                f"{row['count']} ({int(row['year'])})" 
                for _, row 
                in x.iterrows()
            ), include_groups=False)
            .reset_index(name="occurrences (year)")
    )
    return year_counts


def export_calendar_stats(occurrences_df: pd.DataFrame, 
                         sex_counts: pd.DataFrame,
                         life_stage_counts: pd.DataFrame,
                         basisOfRecord_counts: pd.DataFrame,
                         make_unique_sharks_count_func) -> None:
    # Copy after dropping null so pandas doesn't warn about df.loc[:,] vs df[]
    occurrences_df = validate_and_dropna(occurrences_df, ["year", "month"])

    # Get data for calendar
    calendar_counts = make_calendar_df(occurrences_df)

    # Get top 3 publishing countries per year
    calendar_stats = add_top_x_metric(
        occurrences_df, calendar_counts, 
        groupby=["year"],
        top_x=3,
        metric="publishingCountry",
        column_name="Top 3 Publishing Countries"
    )

    # Get count of unique sharks (to compare against total occurrences)
    calendar_stats = make_unique_sharks_count_func(
        source_df=occurrences_df,
        target_df=calendar_stats,
        groupby=["year"]
    )

    # Merge DataFrames
    calendar_stats = calendar_stats.merge(basisOfRecord_counts, on="year", how="left")
    calendar_stats = calendar_stats.merge(sex_counts, on="year", how="left")
    calendar_stats = calendar_stats.merge(life_stage_counts, on="year", how="left")

    calendar_stats = calendar_stats.sort_values(by="year", ascending=False).reset_index()
    export_to_csv(GBIF_CALENDAR_STATS_CSV, calendar_stats)
    

