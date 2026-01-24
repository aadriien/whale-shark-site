###############################################################################
##  `analyze.py`                                                             ##
##                                                                           ##
##  Purpose: Orchestrates all GBIF data analysis (delegates to modules)      ##
###############################################################################


import pandas as pd

from src.utils.data_utils import read_csv, validate_and_dropna
from src.gbif.constants import GBIF_CLEAN_CSV

# Import analysis modules
from src.gbif.analyze_time import (
    export_calendar_stats,
    make_year_total_df,
)
from src.gbif.analyze_demographics import (
    make_sex_df,
    make_lifeStage_df,
)
from src.gbif.analyze_regions import (
    make_eventDate_df,
    make_basisOfRecord_df,
    export_country_stats,
    export_continent_stats,
    export_publishingCountry_stats,
)
from src.gbif.analyze_individuals import (
    make_unique_sharks_count,
    export_individual_shark_stats,
)


def export_all_analyses(dataframe: pd.DataFrame) -> None:
    """
    Main entry point for all GBIF data analysis.
    Coordinates all analysis modules and exports results.
    """
    # Use copy to generate specific CSVs (don't modify original DataFrame)
    occurrences_df = dataframe.copy()

    # Generate demographic data needed by calendar stats
    occurrences_with_year = validate_and_dropna(occurrences_df.copy(), ["year", "month"])
    sex_counts = make_sex_df(occurrences_with_year)
    life_stage_counts = make_lifeStage_df(occurrences_with_year)
    basisOfRecord_counts = make_basisOfRecord_df(occurrences_with_year, index=["year"])

    # Export calendar/time-based stats
    export_calendar_stats(
        occurrences_df=occurrences_df,
        sex_counts=sex_counts,
        life_stage_counts=life_stage_counts,
        basisOfRecord_counts=basisOfRecord_counts,
        make_unique_sharks_count_func=make_unique_sharks_count
    )

    # Export region-based stats
    export_country_stats(
        occurrences_df=occurrences_df,
        make_year_total_df_func=make_year_total_df,
        make_unique_sharks_count_func=make_unique_sharks_count
    )
    export_continent_stats(
        occurrences_df=occurrences_df,
        make_year_total_df_func=make_year_total_df,
        make_unique_sharks_count_func=make_unique_sharks_count
    )
    export_publishingCountry_stats(
        occurrences_df=occurrences_df,
        make_year_total_df_func=make_year_total_df,
        make_unique_sharks_count_func=make_unique_sharks_count
    )

    # Export individual shark tracking stats
    export_individual_shark_stats(
        occurrences_df=occurrences_df,
        make_basisOfRecord_df_func=make_basisOfRecord_df,
        make_eventDate_df_func=make_eventDate_df
    )


if __name__ == "__main__":
    occurrences_df = read_csv(
        GBIF_CLEAN_CSV, 
        dtype={"year": "Int64", "day": "Int64"}
    )
    export_all_analyses(occurrences_df)
 

