###############################################################################
##  `validate_embeddings.py`                                                  ##
##                                                                           ##
##  Purpose: Validates embedding matches using geographical/temporal constraints ##
###############################################################################

from datetime import datetime
from typing import Tuple

import numpy as np
import pandas as pd
from src.gbif.constants import GBIF_CLEAN_CSV, GBIF_MEDIA_CSV
from src.utils.data_utils import export_to_csv, read_csv

from .calculate_coordinate_distance import calculate_distance
from .CONSTANTS import (
    NEW_EMBEDDINGS_FOLDER,
    VALIDATED_MEDIA_MATCHES_FILE,
    VALIDATED_MEDIA_MATCHES_JSON,
    VALIDATED_SHARK_MATCHES_FILE,
    VALIDATED_SHARK_MATCHES_JSON,
)
from .match_embeddings import export_to_json


def implied_speed_km_per_day(
    lat1: float, lon1: float, time1: str, lat2: float, lon2: float, time2: str
) -> float:
    """
    Calculate implied travel speed (km/day) between two timestamped coordinates.
    """
    # Distance in km
    d = calculate_distance(lat1, lon1, lat2, lon2, use_searoute=True)

    # Time difference in days
    try:
        # Handle datetime or just date
        if isinstance(time1, str):
            time1 = datetime.fromisoformat(time1.split("T")[0])
        if isinstance(time2, str):
            time2 = datetime.fromisoformat(time2.split("T")[0])
    except ValueError:
        # Partial dates (e.g. year-only) lack specificity to calculate plausibility
        return float("nan")

    delta_days = abs((time2 - time1).total_seconds()) / (3600 * 24)

    # Avoid division by zero
    if delta_days == 0:
        return float("inf")

    # Implied average speed
    v = d / delta_days
    return v


def could_be_same_shark(
    lat1: float,
    lon1: float,
    time1: str,
    lat2: float,
    lon2: float,
    time2: str,
    vmax: float = 200.0,
) -> Tuple[bool, float]:
    """
    Returns True if the two observations could plausibly belong to the same shark,
    given a biologically plausible maximum travel rate (km/day).

    vmax: maximum plausible sustained travel speed (default = 200 km/day)
    """
    v = implied_speed_km_per_day(lat1, lon1, time1, lat2, lon2, time2)
    return v <= vmax, v


def categorize_plausibility(
    speed: float, distance: float, vmax: float = 200.0, vuncertain: float = 150.0
) -> str:
    """
    Categorize match plausibility based on implied speed and distance.

    vmax: maximum plausible speed (km/day)
    vuncertain: speed threshold for "uncertain" category (km/day)
    """
    if np.isnan(speed) or np.isnan(distance):
        return "UNKNOWN"

    if np.isinf(speed):
        # Same timestamp - physically possible but suspicious
        if distance < 10:  # Within 10km
            return "PLAUSIBLE"
        else:
            return "IMPOSSIBLE"

    if speed <= vuncertain:
        return "PLAUSIBLE"
    elif speed <= vmax:
        return "UNCERTAIN"
    else:
        return "IMPOSSIBLE"


def validate_media_matches(
    media_matches_df: pd.DataFrame, gbif_df: pd.DataFrame, media_df: pd.DataFrame
) -> pd.DataFrame:
    """
    Validate media matches by checking geographical and temporal plausibility.
    """
    print(f"Validating {len(media_matches_df)} media matches...")

    # Drop DINOv2 columns if they exist
    dinov2_cols = [col for col in media_matches_df.columns if "dinov2" in col.lower()]
    if dinov2_cols:
        media_matches_df = media_matches_df.drop(columns=dinov2_cols)

    # Create lookup for GBIF occurrence data by key
    gbif_lookup = (
        gbif_df.groupby("key")
        .first()[
            [
                "decimalLatitude",
                "decimalLongitude",
                "eventDate",
                "whaleSharkID",
                "identificationID",
                "occurrenceID",
            ]
        ]
        .to_dict("index")
    )

    # Geo/temporal validation only applies to GBIF<->GBIF matches. The Ningaloo
    # matches have no comparable occurrence data (lat/lon/date) in this pipeline,
    # so miewid_ningaloo_*/dinov2_ningaloo_* columns simply pass through untouched.

    # Create indexed media dataframe (miewid_gbif_matched_image_id indexes into this)
    media_df_indexed = media_df.reset_index(drop=True)

    # Calculate distance, speed, days between, and plausibility for each match
    distances = []
    speeds = []
    days_between = []
    plausibilities = []
    matched_lats = []
    matched_lons = []
    matched_dates = []

    for _, row in media_matches_df.iterrows():
        # Initialize default values for this row
        distance = np.nan
        speed = np.nan
        days_diff = np.nan
        plausibility = "UNKNOWN"
        lat2 = np.nan
        lon2 = np.nan
        time2 = np.nan

        try:
            query_key = row["key"]
            matched_image_key = row.get("miewid_gbif_matched_image_id")

            # Get query occurrence data
            if query_key in gbif_lookup:
                query_data = gbif_lookup[query_key]
                lat1 = query_data["decimalLatitude"]
                lon1 = query_data["decimalLongitude"]
                time1 = query_data["eventDate"]

                # Get matched image's key from media_df using the index
                if pd.notna(matched_image_key) and 0 <= matched_image_key < len(
                    media_df_indexed
                ):
                    matched_image_row = media_df_indexed.iloc[int(matched_image_key)]
                    matched_key = matched_image_row["key"]

                    # Get matched occurrence data from GBIF
                    if matched_key in gbif_lookup:
                        matched_data = gbif_lookup[matched_key]
                        lat2 = matched_data["decimalLatitude"]
                        lon2 = matched_data["decimalLongitude"]
                        time2 = matched_data["eventDate"]

                        # Check if we have all required data
                        if (
                            pd.notna(lat1)
                            and pd.notna(lon1)
                            and pd.notna(time1)
                            and pd.notna(lat2)
                            and pd.notna(lon2)
                            and pd.notna(time2)
                        ):

                            distance = calculate_distance(
                                lat1, lon1, lat2, lon2, use_searoute=True
                            )
                            speed = implied_speed_km_per_day(
                                lat1, lon1, time1, lat2, lon2, time2
                            )
                            plausibility = categorize_plausibility(speed, distance)

                            # Calculate days between
                            if isinstance(time1, str):
                                t1 = datetime.fromisoformat(time1.split("T")[0])
                            else:
                                t1 = time1
                            if isinstance(time2, str):
                                t2 = datetime.fromisoformat(time2.split("T")[0])
                            else:
                                t2 = time2
                            days_diff = abs((t2 - t1).days)

                            distance = round(distance, 2)
                            speed = round(speed, 2) if not np.isinf(speed) else 999999.0

        except Exception as e:
            print(f"Error validating row: {e}")
            plausibility = "ERROR"

        # Always append exactly once per iteration
        distances.append(distance)
        speeds.append(speed)
        days_between.append(days_diff)
        plausibilities.append(plausibility)
        matched_lats.append(lat2)
        matched_lons.append(lon2)
        matched_dates.append(time2)

    # Add validation columns
    media_matches_df["matched_decimalLatitude"] = matched_lats
    media_matches_df["matched_decimalLongitude"] = matched_lons
    media_matches_df["matched_eventDate"] = matched_dates
    media_matches_df["distance_km"] = distances
    media_matches_df["days_between"] = days_between
    media_matches_df["implied_speed_km_per_day"] = speeds
    media_matches_df["plausibility"] = plausibilities

    # Remove duplicates based on image_id (each unique image should have its own row)
    media_matches_df = media_matches_df.drop_duplicates(
        subset=["image_id"], keep="first"
    )

    print("Validation complete:")
    print(f"  PLAUSIBLE: {(media_matches_df['plausibility'] == 'PLAUSIBLE').sum()}")
    print(f"  UNCERTAIN: {(media_matches_df['plausibility'] == 'UNCERTAIN').sum()}")
    print(f"  IMPOSSIBLE: {(media_matches_df['plausibility'] == 'IMPOSSIBLE').sum()}")
    print(f"  UNKNOWN: {(media_matches_df['plausibility'] == 'UNKNOWN').sum()}")

    return media_matches_df


def explode_shark_matches_to_occurrences(
    shark_matches_df: pd.DataFrame,
    gbif_df: pd.DataFrame,
    media_matches_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Explode shark matches into individual image occurrences with validation.
    Each row in the output represents one image occurrence for a shark ID.
    """
    print(f"Exploding {len(shark_matches_df)} shark IDs into per-image occurrences...")

    # media_matches_df already has validated per-image data
    # (image_id, identifier, match info)
    image_occurrences_df = media_matches_df.copy()
    image_occurrences_df["whaleSharkID"] = image_occurrences_df["whaleSharkID"].astype(
        str
    )

    # Add query occurrence lat/lon/date keyed by whaleSharkID (source of truth)
    gbif_coords_by_shark = (
        gbif_df.groupby("whaleSharkID")
        .first()[["decimalLatitude", "decimalLongitude", "eventDate"]]
        .reset_index()
    )
    gbif_coords_by_shark["whaleSharkID"] = gbif_coords_by_shark["whaleSharkID"].astype(
        str
    )
    image_occurrences_df = image_occurrences_df.merge(
        gbif_coords_by_shark, on="whaleSharkID", how="left"
    )

    # Add shark-level summary fields
    shark_sighting_summary = shark_matches_df[
        [
            "whaleSharkID",
            "Oldest Occurrence",
            "Newest Occurrence",
            "country (year)",
            "stateProvince - verbatimLocality (month year)",
        ]
    ].copy()
    shark_sighting_summary["whaleSharkID"] = shark_sighting_summary[
        "whaleSharkID"
    ].astype(str)
    image_occurrences_df = image_occurrences_df.merge(
        shark_sighting_summary, on="whaleSharkID", how="left"
    )

    # Rename columns to match expected output schema.
    # Unsuffixed names stay the GBIF<->GBIF "default lens" (preserving the
    # existing website schema). Ningaloo matches ride alongside as a parallel,
    # explicitly-suffixed family for a future toggle between the two views.
    image_occurrences_df = image_occurrences_df.rename(
        columns={
            "identifier": "identifier_url",
            "miewid_gbif_closest_whale_shark_id": "matched_shark_id",
            "miewid_gbif_matched_image_id": "matched_image_id",
            "miewid_gbif_distance": "match_distance",
            "miewid_ningaloo_closest_whale_shark_id": "matched_shark_id_ningaloo",
            "miewid_ningaloo_matched_image_id": "matched_image_id_ningaloo",
            "miewid_ningaloo_distance": "match_distance_ningaloo",
        }
    )

    # Select & order output columns
    output_cols = [
        "whaleSharkID",
        "identificationID",
        "occurrenceID",
        "key",
        "image_id",
        "identifier_url",
        "decimalLatitude",
        "decimalLongitude",
        "eventDate",
        "Oldest Occurrence",
        "Newest Occurrence",
        "country (year)",
        "stateProvince - verbatimLocality (month year)",
        "matched_shark_id",
        "matched_image_id",
        "match_distance",
        "matched_decimalLatitude",
        "matched_decimalLongitude",
        "matched_eventDate",
        "distance_km",
        "days_between",
        "implied_speed_km_per_day",
        "plausibility",
        "matched_shark_id_ningaloo",
        "matched_image_id_ningaloo",
        "match_distance_ningaloo",
    ]
    image_occurrences_df = image_occurrences_df[
        [c for c in output_cols if c in image_occurrences_df.columns]
    ]

    print(
        f"Created {len(image_occurrences_df)} image occurrence rows"
        f" from {image_occurrences_df['whaleSharkID'].nunique()} shark IDs"
    )
    print("Validation summary:")
    print(f"  PLAUSIBLE: {(image_occurrences_df['plausibility'] == 'PLAUSIBLE').sum()}")
    print(f"  UNCERTAIN: {(image_occurrences_df['plausibility'] == 'UNCERTAIN').sum()}")
    print(
        f"  IMPOSSIBLE: {(image_occurrences_df['plausibility'] == 'IMPOSSIBLE').sum()}"
    )
    print(f"  UNKNOWN: {(image_occurrences_df['plausibility'] == 'UNKNOWN').sum()}")

    return image_occurrences_df


def validate_shark_match_family(
    shark_matches_df: pd.DataFrame, gbif_lookup: dict, label: str, summary_colname: str
) -> dict:
    """
    Extract the matched shark ID from a formatted match summary column
    (e.g. "MIEWID GBIF: shark (image_id, distance), ...") and compute
    geographical/temporal plausibility against GBIF occurrence data.

    Matches pointing outside the GBIF lookup (e.g. Ningaloo shark names) always
    resolve to UNKNOWN, since there's no occurrence data to validate against.
    """
    import re

    pattern = re.escape(label) + r":\s*([^\(]+)"

    def extract_matched_id(formatted_str):
        if pd.isna(formatted_str):
            return None
        match = re.search(pattern, formatted_str)
        return match.group(1).strip() if match else None

    matched_ids = shark_matches_df[summary_colname].apply(extract_matched_id)

    # Calculate distance, speed, days between, and plausibility
    distances, speeds, days_between, plausibilities = [], [], [], []
    matched_lats, matched_lons, matched_dates = [], [], []

    for shark_id, matched_id in zip(shark_matches_df["whaleSharkID"], matched_ids):
        lat2 = lon2 = time2 = np.nan
        try:
            has_comparable_data = (
                shark_id in gbif_lookup
                and pd.notna(matched_id)
                and matched_id in gbif_lookup
            )

            if not has_comparable_data:
                plausibility = "UNKNOWN"
                distance = speed = days_diff = np.nan
            else:
                # Get query shark data
                shark_data = gbif_lookup[shark_id]
                lat1 = shark_data["decimalLatitude"]
                lon1 = shark_data["decimalLongitude"]
                time1 = shark_data["eventDate"]

                # Get matched shark data
                matched_data = gbif_lookup[matched_id]
                lat2 = matched_data["decimalLatitude"]
                lon2 = matched_data["decimalLongitude"]
                time2 = matched_data["eventDate"]

                if (
                    pd.notna(lat1)
                    and pd.notna(lon1)
                    and pd.notna(time1)
                    and pd.notna(lat2)
                    and pd.notna(lon2)
                    and pd.notna(time2)
                ):
                    distance = calculate_distance(
                        lat1, lon1, lat2, lon2, use_searoute=True
                    )
                    speed = implied_speed_km_per_day(
                        lat1, lon1, time1, lat2, lon2, time2
                    )
                    plausibility = categorize_plausibility(speed, distance)

                    # Calculate days between (skip if speed is NaN; date not specific)
                    days_diff = np.nan
                    if not np.isnan(speed):
                        t1 = (
                            datetime.fromisoformat(time1.split("T")[0])
                            if isinstance(time1, str)
                            else time1
                        )
                        t2 = (
                            datetime.fromisoformat(time2.split("T")[0])
                            if isinstance(time2, str)
                            else time2
                        )
                        days_diff = abs((t2 - t1).days)

                    distance = round(distance, 2)
                    speed = round(speed, 2) if not np.isinf(speed) else 999999.0
                else:
                    plausibility = "UNKNOWN"
                    distance = speed = days_diff = np.nan

            plausibilities.append(plausibility)
            distances.append(distance)
            speeds.append(speed)
            days_between.append(days_diff)

        except Exception as e:
            print(f"Error validating {label} row: {e}")
            plausibilities.append("ERROR")
            distances.append(np.nan)
            speeds.append(np.nan)
            days_between.append(np.nan)

        matched_lats.append(lat2)
        matched_lons.append(lon2)
        matched_dates.append(time2)

    # Return validation columns
    return {
        "matched_decimalLatitude": matched_lats,
        "matched_decimalLongitude": matched_lons,
        "matched_eventDate": matched_dates,
        "distance_km": distances,
        "days_between": days_between,
        "implied_speed_km_per_day": speeds,
        "plausibility": plausibilities,
    }


def validate_shark_matches(
    shark_matches_df: pd.DataFrame, gbif_df: pd.DataFrame
) -> pd.DataFrame:
    """
    Validate shark ID matches by checking geographical and temporal plausibility,
    in parallel for the closest-GBIF-match and closest-Ningaloo-match columns.
    """
    print(f"Validating {len(shark_matches_df)} shark ID matches...")

    # Drop DINOv2 columns if they exist (validation only runs on MIEWID matches)
    dinov2_cols = [col for col in shark_matches_df.columns if "dinov2" in col.lower()]
    if dinov2_cols:
        shark_matches_df = shark_matches_df.drop(columns=dinov2_cols)

    # Create lookup for GBIF data
    # Handle duplicate whaleSharkIDs by keeping first occurrence per ID
    gbif_lookup = (
        gbif_df.groupby("whaleSharkID")
        .first()[["decimalLatitude", "decimalLongitude", "eventDate"]]
        .to_dict("index")
    )

    # Run plausibility validation in parallel for the GBIF-closest and
    # Ningaloo-closest match columns. The Ningaloo pass always resolves to
    # UNKNOWN (Ningaloo names aren't in gbif_lookup), but produces the same
    # column shape so a future UI can toggle between the two consistently.
    match_families = [("gbif", "MIEWID GBIF"), ("ningaloo", "MIEWID NINGALOO")]

    for suffix, label in match_families:
        summary_colname = (
            f"{label}: closest_whale_shark_id (matched_image_id, distance)"
        )
        validation = validate_shark_match_family(
            shark_matches_df, gbif_lookup, label, summary_colname
        )
        for col_name, values in validation.items():
            shark_matches_df[f"{col_name}_{suffix}"] = values

    # Remove duplicates based on whaleSharkID
    shark_matches_df = shark_matches_df.drop_duplicates(
        subset=["whaleSharkID"], keep="first"
    )

    print("Validation complete:")
    for suffix, _ in match_families:
        col = f"plausibility_{suffix}"
        print(f"  {suffix.upper()}:")
        print(f"    PLAUSIBLE: {(shark_matches_df[col] == 'PLAUSIBLE').sum()}")
        print(f"    UNCERTAIN: {(shark_matches_df[col] == 'UNCERTAIN').sum()}")
        print(f"    IMPOSSIBLE: {(shark_matches_df[col] == 'IMPOSSIBLE').sum()}")
        print(f"    UNKNOWN: {(shark_matches_df[col] == 'UNKNOWN').sum()}")

    return shark_matches_df


if __name__ == "__main__":
    # Load GBIF clean data for coordinates and dates
    print("Loading GBIF clean data...")
    gbif_df = read_csv(GBIF_CLEAN_CSV)

    # Load GBIF media data (needed to map miewid_gbif_matched_image_id back to keys)
    print("Loading GBIF media data...")
    media_df = read_csv(GBIF_MEDIA_CSV)

    # Load media matches
    print("Loading media matches...")
    media_matches_file = f"{NEW_EMBEDDINGS_FOLDER}/GBIF_media_matches.csv"
    media_matches_df = read_csv(media_matches_file)

    # Each *_closest_whale_shark_id family is now population-homogeneous
    # (all-numeric GBIF whaleSharkIDs, or all-UUID Ningaloo names), so pandas
    # can infer some as int64 on reload. Force them back to strings so they
    # match how IDs are keyed (as strings) in the downstream website JSON.
    closest_id_cols = [
        "miewid_gbif_closest_whale_shark_id",
        "miewid_ningaloo_closest_whale_shark_id",
        "dinov2_gbif_closest_whale_shark_id",
        "dinov2_ningaloo_closest_whale_shark_id",
    ]
    for col in closest_id_cols:
        if col in media_matches_df.columns:
            media_matches_df[col] = media_matches_df[col].astype(str)

    # Validate media matches
    validated_media_df = validate_media_matches(media_matches_df, gbif_df, media_df)

    # Export media matches
    print("Exporting validated media matches to CSV and JSON...")
    export_to_csv(VALIDATED_MEDIA_MATCHES_FILE, validated_media_df)
    export_to_json(VALIDATED_MEDIA_MATCHES_JSON, validated_media_df)

    # Load shark ID matches
    print("Loading shark ID matches...")
    shark_matches_file = f"{NEW_EMBEDDINGS_FOLDER}/GBIF_shark_matches.csv"
    shark_matches_df = read_csv(shark_matches_file)

    # Validate shark ID matches
    validated_shark_df = validate_shark_matches(shark_matches_df, gbif_df)

    # Drop unnecessary validation columns before exporting (kept only for the
    # console summary above; both gbif and ningaloo families get dropped here)
    columns_to_drop = [
        f"{base}_{suffix}"
        for suffix in ("gbif", "ningaloo")
        for base in (
            "matched_decimalLatitude",
            "matched_decimalLongitude",
            "matched_eventDate",
            "distance_km",
            "days_between",
            "implied_speed_km_per_day",
            "plausibility",
        )
    ]
    shark_df_for_export = validated_shark_df.drop(
        columns=columns_to_drop, errors="ignore"
    )

    # Export shark ID matches
    print("Exporting validated shark ID matches to CSV and JSON...")
    export_to_csv(VALIDATED_SHARK_MATCHES_FILE, shark_df_for_export)
    export_to_json(VALIDATED_SHARK_MATCHES_JSON, shark_df_for_export)

    # Create exploded per-image occurrence file
    print("\nCreating per-image occurrence file...")
    exploded_df = explode_shark_matches_to_occurrences(
        shark_matches_df, gbif_df, validated_media_df
    )

    # Export exploded data
    exploded_csv = f"{NEW_EMBEDDINGS_FOLDER}/GBIF_shark_image_occurrences_validated.csv"
    exploded_json = (
        "./website/src/assets/data/json/GBIF_shark_image_occurrences_validated.json"
    )
    print("Exporting per-image occurrences to CSV and JSON...")
    export_to_csv(exploded_csv, exploded_df)
    export_to_json(exploded_json, exploded_df)

    print("\nValidation complete!")
    print(f"  Media matches: {VALIDATED_MEDIA_MATCHES_FILE}")
    print(f"  Shark ID matches: {VALIDATED_SHARK_MATCHES_FILE}")
    print(f"  Shark image occurrences: {exploded_csv}")
