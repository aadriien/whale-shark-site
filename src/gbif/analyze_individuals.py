###############################################################################
##  `analyze_individuals.py`                                                 ##
##                                                                           ##
##  Purpose: Individual whale shark tracking & analysis                      ##
###############################################################################


import re
import pandas as pd
from datetime import datetime
from typing import Union, Callable

from src.utils.data_utils import (
    read_csv, export_to_csv, export_to_json, validate_and_dropna, 
    move_column_after, add_totals_column,
)
from src.utils.geomap_utils import get_LME_from_coords
from src.gbif.constants import (
    GBIF_MEDIA_CSV,
    GBIF_INDIVIDUAL_SHARKS_STATS_CSV,
    GBIF_SHARK_TRACKING_JSON,
    GBIF_STORY_SHARKS_CSV,
    GBIF_STORY_SHARK_TRACKING_JSON,
    GBIF_SHARK_TRACKING_MULTI_GEOJSON,
    GBIF_SHARK_TRACKING_LINE_GEOJSON,
    GBIF_MEDIA_SHARKS_CSV,
    GBIF_MEDIA_SHARK_TRACKING_JSON,
)


def make_unique_sharks_count(source_df: pd.DataFrame, 
                            target_df: pd.DataFrame, 
                            groupby: list[str]) -> pd.DataFrame:
    # Get unique sharks 
    source_df = validate_and_dropna(source_df, na_subset=["whaleSharkID"] + groupby)
    unique_sharks = source_df.drop_duplicates(subset=["whaleSharkID"]).reset_index()

    # Copy to make pandas happy
    target_df = target_df.copy()

    target_df["Unique Sharks (with ID)"] = unique_sharks.groupby(groupby).size()
    target_df["Unique Sharks (with ID)"] = (
        target_df["Unique Sharks (with ID)"]
        .fillna(0).astype(int)
    )
    
    target_df = move_column_after(
        dataframe=target_df, 
        col_to_move="Unique Sharks (with ID)", 
        after_col="Total Occurrences"
    )

    return target_df


def make_individual_metric_df(occurrences_df: pd.DataFrame, 
                            individual_sharks: pd.DataFrame,
                            metric_subset: list[str],
                            metric_timing: list[str],
                            format_str_or_func: Union[str, Callable],
                            column_name: str) -> pd.DataFrame:

    # Combine metrics (e.g. ["decimalLatitude", "decimalLongitude"] + ["eventDate"])
    all_metric_vals = metric_subset + metric_timing

    # Now, non-null specific metric by chosen time views (e.g. month year)
    valid_metric = occurrences_df.dropna(subset=metric_subset).copy()

    # Ugly type casting trick to populate & format null vals :/
    with pd.option_context('future.no_silent_downcasting', True):
        for time_view in metric_timing:
            valid_metric[time_view] = (
                valid_metric[time_view].astype(object)
                .fillna(f"{time_view} Unknown").astype(str)
            )

    # Allow passing of str OR formatting function (e.g. lat/lon region retrieval)
    def format_row(vals):
        if callable(format_str_or_func):
            return format_str_or_func(*vals)
        else:
            return format_str_or_func.format(*vals)

    # Assemble specific metric values over time per shark ID (e.g. lifeStage)
    valid_metric = valid_metric.groupby("whaleSharkID").apply(
        # Use `dict.fromkeys` instead of `sorted(set` to preserve original order
        lambda x: ", ".join(dict.fromkeys(
            # Example: zip occurrenceRemarks with eventDate
            format_row(vals) 
            for vals in 
            zip(*(x[col] for col in all_metric_vals))
        )), 
        include_groups=False
    ).reset_index().rename(columns={0: column_name})

    individual_sharks = individual_sharks.merge(valid_metric, on="whaleSharkID", how="left")
    individual_sharks.loc[:, column_name] = individual_sharks[column_name].fillna("Unknown")

    return individual_sharks


def latlon_region_formatter(lat, long, eventDate):
    region = get_LME_from_coords(lat, long)

    if region is None:
        region = "Unknown"
    return f"lat:{lat} long:{long} ({region} {eventDate})"


def assemble_individual_metrics(occurrences_df: pd.DataFrame, 
                                individual_sharks: pd.DataFrame) -> pd.DataFrame:
    # Build "lifeStage (year)" metric
    individual_sharks = make_individual_metric_df(
        occurrences_df=occurrences_df, individual_sharks=individual_sharks,
        metric_subset=["lifeStage"], metric_timing=["year"],
        format_str_or_func="{0} ({1})", # == f"{stage} ({year})"
        column_name="lifeStage (year)"
    )

    # Build "continent (year)" metric
    individual_sharks = make_individual_metric_df(
        occurrences_df=occurrences_df, individual_sharks=individual_sharks,
        metric_subset=["continent"], metric_timing=["year"],
        format_str_or_func="{0} ({1})", # == f"{continent} ({year})"
        column_name="continent (year)"
    )

    # Build "publishingCountry (year)" metric
    individual_sharks = make_individual_metric_df(
        occurrences_df=occurrences_df, individual_sharks=individual_sharks,
        metric_subset=["publishingCountry"], metric_timing=["year"],
        format_str_or_func="{0} ({1})", # == f"{publishingCountry} ({year})"
        column_name="publishingCountry (year)"
    )

    # Build "country (year)" metric
    individual_sharks = make_individual_metric_df(
        occurrences_df=occurrences_df, individual_sharks=individual_sharks,
        metric_subset=["country"], metric_timing=["year"],
        format_str_or_func="{0} ({1})", # == f"{country} ({year})"
        column_name="country (year)"
    )

    # Build "stateProvince - verbatimLocality (month year)" metric
    individual_sharks = make_individual_metric_df(
        occurrences_df=occurrences_df, individual_sharks=individual_sharks,
        metric_subset=["stateProvince", "verbatimLocality"], metric_timing=["month", "year"],
        format_str_or_func="{0} - {1} ({2} {3})", # == f"{state} - {locality} ({month} {year})"
        column_name="stateProvince - verbatimLocality (month year)"
    )

    # Build "occurrenceRemarks (eventDate)" metric
    individual_sharks = make_individual_metric_df(
        occurrences_df=occurrences_df, individual_sharks=individual_sharks,
        metric_subset=["occurrenceRemarks"], metric_timing=["eventDate"],
        format_str_or_func="{0} ({1})", # == f"{occurrenceRemarks} ({eventDate})"
        column_name="occurrenceRemarks (eventDate)"
    )

    # Build "lat:decimalLatitude long:decimalLongitude (eventDate)" metric
    individual_sharks = make_individual_metric_df(
        occurrences_df=occurrences_df, individual_sharks=individual_sharks,
        metric_subset=["decimalLatitude", "decimalLongitude"], metric_timing=["eventDate"],
        format_str_or_func=latlon_region_formatter, # == f"lat:{latitude} long:{longitude} ({region}, {eventDate})"
        column_name="lat:decimalLatitude long:decimalLongitude (eventDate)"
    )

    return individual_sharks


def make_media_conditions(occurrences_df: pd.DataFrame, 
                        individual_sharks: pd.DataFrame) -> pd.DataFrame:
    # Anything more restrictive probably not usable
    license_types = {
        "http://creativecommons.org/licenses/by/4.0/": "CC BY [Attribution]",
        "http://creativecommons.org/licenses/by-nc/4.0/": "CC BY-NC [Attribution-NonCommercial]",
        "http://creativecommons.org/licenses/by-nc-nd/4.0/": "CC BY-NC [Attribution-NoDerivatives]",
        "http://creativecommons.org/licenses/by-nc-sa/4.0/": "CC BY-NC [Attribution-ShareAlike]",
        "http://creativecommons.org/publicdomain/zero/1.0/": "CC0 [Public Domain]"
    }

    media_fields = [
        "key",
        "identificationID", # shark ID (?)
        "creator",
        "license",
        "rightsHolder",
        "identifier" # image URL
    ]

    media_df = read_csv(GBIF_MEDIA_CSV)

    # Merge with media & extract licensing rights
    occurrences_media = occurrences_df.merge(media_df[media_fields], on = "key")    
    occurrences_media["license"] = occurrences_media["license"].replace(license_types)

    # Build "identifier (license: license, creator: creator)" metric
    individual_sharks = make_individual_metric_df(
        occurrences_df=occurrences_media, individual_sharks=individual_sharks,
        metric_subset=["identifier"], metric_timing=["license", "creator"],
        format_str_or_func="{0} (license: {1}, creator: {2})", # == f"{identifier} (license: {license}, creator: {creator})"
        column_name="imageURL (license, creator)"
    )

    return individual_sharks


def parse_coordinates_history(coordinates_str_list: str) -> list[dict]:
    if coordinates_str_list == "Unknown" or not isinstance(coordinates_str_list, str):
        return []
    
    entries = coordinates_str_list.split(", ")
    parsed = []

    for entry in entries:
        match = re.match(r"lat:([-\d.]+) long:([-\d.]+) \(([^,]+) ([^)]+)\)", entry)
        if match:
            lat, long, region, eventDate = match.groups()

            # Try parsing in order: full date, year-month, year
            for time_format in ("%Y-%m-%d", "%Y-%m", "%Y"):
                try:
                    # e.g. "2024" defaults to "2024-01-01"
                    parsed_date = datetime.strptime(eventDate.strip(), time_format)
                    break
                except ValueError:
                    continue
            else:
                # If no time formats matched, push to end
                parsed_date = datetime.max

            parsed.append({
                "lat": float(lat),
                "long": float(long),
                "region": region.strip(),
                "eventDate": eventDate,
                "parsedDate": parsed_date # temp field for sort & display on globe
            })

    # Sort chronologically, then convert to str before return (avoid JSON errors)
    parsed.sort(key=lambda x: x["parsedDate"])

    for item in parsed:
        item["parsedDate"] = item["parsedDate"].strftime("%Y-%m-%d")

    return parsed


def export_shark_tracking_json(shark_df: pd.DataFrame, json_file: str) -> None:
    # Build export list
    output = []
    for _, row in shark_df.iterrows():
        coords = parse_coordinates_history(row["lat:decimalLatitude long:decimalLongitude (eventDate)"])
        
        # Skip if "Unknown" or parsing failed
        if coords:  
            output.append({
                "whaleSharkID": row["whaleSharkID"],
                "coordinates": coords
            })

    export_to_json(json_file, output)


# Function to get coords data in GeoJSON format for Copernicus Marine MyOcean layer
def export_shark_tracking_geojson(shark_df: pd.DataFrame, 
                                  geojson_file: str, 
                                  geometry_type: str = "MultiPoint") -> None:
    features = []

    for _, row in shark_df.iterrows():
        coords = parse_coordinates_history(row["lat:decimalLatitude long:decimalLongitude (eventDate)"])

        if not coords:
            continue

        # Prepare MultiPoint coords (+ metadata), given that GeoJSON uses [lon, lat]
        coordinates = [[point["long"], point["lat"]] for point in coords]
        event_dates = [point["eventDate"] for point in coords]

        # Remove duplicates by creating a set, then restore to list for GeoJSON
        regions = list({point["region"] for point in coords}) 

        features.append({
            "type": "Feature",
            "geometry": {
                "type": geometry_type, # e.g. "MultiPoint" or "LineString"
                "coordinates": coordinates
            },
            "properties": {
                "whaleSharkID": row["whaleSharkID"],
                "eventDates": event_dates,
                "regions": regions
            }
        })

    geojson_data = {
        "type": "FeatureCollection",
        "features": features
    }

    export_to_json(geojson_file, geojson_data)


def export_story_sharks(individual_sharks: pd.DataFrame) -> None:
    frequently_sighted = individual_sharks.loc[individual_sharks["Total Occurrences"] > 3]
    
    frequently_sighted = (
        frequently_sighted.sort_values(by="Total Occurrences", ascending=True)
        .reset_index(drop=True)
    )

    export_to_csv(GBIF_STORY_SHARKS_CSV, frequently_sighted)
    export_shark_tracking_json(shark_df=frequently_sighted, json_file=GBIF_STORY_SHARK_TRACKING_JSON)


def export_media_sharks(individual_sharks: pd.DataFrame) -> None:
    has_media = individual_sharks.loc[individual_sharks["imageURL (license, creator)"] != "Unknown"]
    valid = has_media.loc[has_media["lat:decimalLatitude long:decimalLongitude (eventDate)"] != "Unknown"]

    export_to_csv(GBIF_MEDIA_SHARKS_CSV, valid)
    export_shark_tracking_json(shark_df=valid, json_file=GBIF_MEDIA_SHARK_TRACKING_JSON)


def export_individual_shark_stats(occurrences_df: pd.DataFrame,
                                 make_basisOfRecord_df_func,
                                 make_eventDate_df_func) -> None:
    occurrences_df = validate_and_dropna(occurrences_df, na_subset=["whaleSharkID", "eventDate"])

    # Now focus on clean entries & map info (sex, lifeStage, etc) where available
    individual_sharks = occurrences_df[["whaleSharkID", "organismID", "identificationID"]].drop_duplicates().reset_index(drop=True)
    individual_sharks.set_index("whaleSharkID", inplace=True)

    individual_sharks = add_totals_column(
        source_df=occurrences_df,
        target_df=individual_sharks,
        groupby=["whaleSharkID"]
    )

    # Oldest & newest occurrence eventDates
    date_min_max = make_eventDate_df_func(occurrences_df, groupby=["whaleSharkID"])
    individual_sharks = individual_sharks.merge(date_min_max, on=["whaleSharkID"], how="left")

    # Observation type (human/divers vs machine/satellites)
    basisOfRecord_counts = make_basisOfRecord_df_func(occurrences_df, index=["whaleSharkID"])
    individual_sharks = individual_sharks.merge(basisOfRecord_counts, on="whaleSharkID", how="left")

    sex_mappings = (
        occurrences_df[occurrences_df["sex"].isin(["Female", "Male"])] 
        .drop_duplicates(subset="whaleSharkID", keep="first") 
        [["whaleSharkID", "sex"]] 
    )
    individual_sharks = individual_sharks.merge(sex_mappings, on="whaleSharkID", how="left")
    individual_sharks.loc[:, "sex"] = individual_sharks["sex"].fillna("Unknown")

    # Build & assemble all other relevant metrics (e.g. lifeStage, locations, etc)
    individual_sharks = assemble_individual_metrics(occurrences_df, individual_sharks)

    # Get any available media (+ licensing rights)
    individual_sharks = make_media_conditions(occurrences_df, individual_sharks)

    export_to_csv(GBIF_INDIVIDUAL_SHARKS_STATS_CSV, individual_sharks)

    # Also build & export datasets for globe / storytelling
    export_shark_tracking_json(shark_df=individual_sharks, json_file=GBIF_SHARK_TRACKING_JSON)
    export_story_sharks(individual_sharks)
    export_media_sharks(individual_sharks)

    # Extract tracking coords as GeoJSON (all at once + chronological sequence)
    export_shark_tracking_geojson(
        shark_df=individual_sharks, 
        geojson_file=GBIF_SHARK_TRACKING_MULTI_GEOJSON, 
        geometry_type="MultiPoint"
    )
    export_shark_tracking_geojson(
        shark_df=individual_sharks, 
        geojson_file=GBIF_SHARK_TRACKING_LINE_GEOJSON, 
        geometry_type="LineString"
    )
    

