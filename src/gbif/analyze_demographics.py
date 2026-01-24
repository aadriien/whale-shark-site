###############################################################################
##  `analyze_demographics.py`                                                ##
##                                                                           ##
##  Purpose: Demographics analysis for GBIF data (sex, life stage)           ##
###############################################################################


import pandas as pd


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
    

