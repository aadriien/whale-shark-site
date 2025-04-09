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
    read_csv, export_to_csv, validate_and_dropna, move_columns, standardize_column_vals,
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

    # Preserve month order appearance
    calendar_counts.columns = pd.CategoricalIndex(
        calendar_counts.columns,
        categories=MONTH_NAMES,
        ordered=True
    )
    calendar_counts = calendar_counts.sort_index(axis=1)

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
##      - UPDATE: consolidated into whaleSharkID during cleaning
##  - sex (if available)
##  - lifeStage (if available, as of given year)
##      - store/display as str from list, e.g. "Juvenile (2019), Adult (2024)"
##  - all sightings/occurrences (by key/ID, to map for further info)
##      - store list of all corresponding keys from full GBIF clean dataset
##      - can also store occurrenceIDs if desired BUT they're not all uniform
##      - UPDATE: definitely NOT doing this b/c some sharks have hundreds
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
##          - example 1: "lat:-34.996 long:150.829 (2025-01-03)" 
##          - example 2: "lat:24.178 long:-110.416 (2025-01-05)"
##
#####


def export_individual_shark_stats(occurrences_df: pd.DataFrame) -> None:
    occurrences_df = validate_and_dropna(occurrences_df, na_subset=["whaleSharkID"])

    # Now focus on clean entries & map info (sex, lifeStage, etc) where available
    individual_sharks = occurrences_df[["whaleSharkID"]].drop_duplicates().reset_index(drop=True)
    individual_sharks.set_index("whaleSharkID", inplace=True)

    individual_sharks = add_totals_column(
        source_df=occurrences_df,
        target_df=individual_sharks,
        groupby=["whaleSharkID"]
    )

    sex_mappings = (
        occurrences_df[occurrences_df["sex"].isin(["Female", "Male"])] 
        .drop_duplicates(subset="whaleSharkID", keep="first") 
        [["whaleSharkID", "sex"]] 
    )
    individual_sharks = individual_sharks.merge(sex_mappings, on="whaleSharkID", how="left")
    individual_sharks.loc[:, "sex"] = individual_sharks["sex"].fillna("Unknown")



    valid_lifeStage = occurrences_df.dropna(subset=["lifeStage"]).copy()

    # Ugly type casting trick to populate null year vals (type int) to str :/
    valid_lifeStage["year"] = valid_lifeStage["year"].astype(object).fillna("Year Unknown").astype(str)

    # Assemble lifeStage vals over time per shark ID
    valid_lifeStage = valid_lifeStage.groupby("whaleSharkID").apply(
        lambda x: ", ".join(sorted(set(
            f"{stage} ({year})" for stage, year in zip(x["lifeStage"], x["year"])
        ))), 
        include_groups=False
    ).reset_index(name="lifeStage")

    individual_sharks = individual_sharks.merge(valid_lifeStage, on="whaleSharkID", how="left")



    # Roughly same process, but now tracing countries where sighted
    valid_country = occurrences_df.dropna(subset=["country"]).copy()

    # Ugly type casting trick to populate null year vals (type int) to str :/
    valid_country["year"] = valid_country["year"].astype(object).fillna("Year Unknown").astype(str)

    # Assemble country vals over time per shark ID
    valid_country = valid_country.groupby("whaleSharkID").apply(
        lambda x: ", ".join(sorted(set(
            f"{country} ({year})" for country, year in zip(x["country"], x["year"])
        ))), 
        include_groups=False
    ).reset_index(name="country")

    individual_sharks = individual_sharks.merge(valid_country, on="whaleSharkID", how="left")
    individual_sharks.loc[:, "country"] = individual_sharks["country"].fillna("Unknown")




    # Now specific places by month + year
    valid_locality = occurrences_df.dropna(subset=["stateProvince", "verbatimLocality"]).copy()

    # Ugly type casting trick to populate null vals :/
    valid_locality["month"] = valid_locality["month"].astype(object).fillna("Month Unknown").astype(str)
    valid_locality["year"] = valid_locality["year"].apply(
        lambda x: str(int(x)) if pd.notnull(x) else "Year Unknown"
    )


    # Assemble specific location vals over time per shark ID
    valid_locality = valid_locality.groupby("whaleSharkID").apply(
        lambda x: ", ".join(sorted(set(
            f"{state} - {locality} ({month} {year})" for 
            state, locality, month, year in 
            zip(x["stateProvince"], x["verbatimLocality"], x["month"], x["year"])
        ))), 
        include_groups=False
    ).reset_index(name="stateLocality")

    individual_sharks = individual_sharks.merge(valid_locality, on="whaleSharkID", how="left")
    individual_sharks.loc[:, "stateLocality"] = individual_sharks["stateLocality"].fillna("Unknown")




    # Now latitude & longitude coordinates by eventDate
    valid_coordinates = occurrences_df.dropna(subset=["decimalLatitude", "decimalLongitude"]).copy()

    # Ugly type casting trick to populate null vals :/
    valid_coordinates["eventDate"] = valid_coordinates["eventDate"].astype(object).fillna("eventDate Unknown").astype(str)

    # Assemble specific location vals over time per shark ID
    valid_coordinates = valid_coordinates.groupby("whaleSharkID").apply(
        lambda x: ", ".join(sorted(set(
            f"lat:{latitude} long:{longitude} ({eventDate})" for 
            latitude, longitude, eventDate in 
            zip(x["decimalLatitude"], x["decimalLongitude"], x["eventDate"])
        ))), 
        include_groups=False
    ).reset_index(name="coordinatesLatLong")

    individual_sharks = individual_sharks.merge(valid_coordinates, on="whaleSharkID", how="left")
    individual_sharks.loc[:, "coordinatesLatLong"] = individual_sharks["coordinatesLatLong"].fillna("Unknown")





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
        dtype={"year": "Int64", "day": "Int64"}
    )
    export_all_analyses(occurrences_df)
    




