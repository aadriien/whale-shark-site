###############################################################################
##  `validate_embeddings.py`                                                  ##
##                                                                           ##
##  Purpose: Validates embedding matches using geographical/temporal constraints ##
###############################################################################

import pandas as pd
import numpy as np
from math import radians, sin, cos, asin, sqrt
from datetime import datetime
from typing import Tuple, Optional

from src.utils.data_utils import read_csv, export_to_csv
from src.clean.gbif import GBIF_CLEAN_CSV, GBIF_MEDIA_CSV
from .match_embeddings import (
    NEW_EMBEDDINGS_FOLDER, JSON_OUTPUT_FOLDER,
    export_to_json
)


# Output files
VALIDATED_MEDIA_MATCHES_FILE = f"{NEW_EMBEDDINGS_FOLDER}/GBIF_media_matches_validated.csv"
VALIDATED_SHARK_MATCHES_FILE = f"{NEW_EMBEDDINGS_FOLDER}/GBIF_shark_matches_validated.csv"

VALIDATED_MEDIA_MATCHES_JSON = f"{JSON_OUTPUT_FOLDER}/GBIF_media_matches_validated.json"
VALIDATED_SHARK_MATCHES_JSON = f"{JSON_OUTPUT_FOLDER}/GBIF_shark_matches_validated.json"


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate great-circle distance (in km) between two points on Earth.
    """
    R = 6371.0  # Earth's radius in kilometers

    # Convert degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    # Differences
    dlat = lat2 - lat1
    dlon = lon2 - lon1

    # Haversine formula
    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c = 2 * asin(sqrt(a))
    distance = R * c
    return distance


def implied_speed_km_per_day(
    lat1: float, lon1: float, time1: str,
    lat2: float, lon2: float, time2: str
) -> float:
    """
    Calculate implied travel speed (km/day) between two timestamped coordinates.
    """
    # Distance in km
    d = haversine_distance(lat1, lon1, lat2, lon2)
    
    # Time difference in days
    if isinstance(time1, str):
        time1 = datetime.fromisoformat(time1.split('T')[0])  # Handle datetime or just date
    if isinstance(time2, str):
        time2 = datetime.fromisoformat(time2.split('T')[0])
    
    delta_days = abs((time2 - time1).total_seconds()) / (3600 * 24)
    
    # Avoid division by zero
    if delta_days == 0:
        return float('inf')
    
    # Implied average speed
    v = d / delta_days
    return v


def could_be_same_shark(
    lat1: float, lon1: float, time1: str,
    lat2: float, lon2: float, time2: str,
    vmax: float = 200.0
) -> Tuple[bool, float]:
    """
    Returns True if the two observations could plausibly belong to the same shark,
    given a biologically plausible maximum travel rate (km/day).
    
    vmax: maximum plausible sustained travel speed (default = 200 km/day)
    """
    v = implied_speed_km_per_day(lat1, lon1, time1, lat2, lon2, time2)
    return v <= vmax, v


def categorize_plausibility(speed: float, distance: float, vmax: float = 200.0, vuncertain: float = 150.0) -> str:
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


def validate_media_matches(media_matches_df: pd.DataFrame, gbif_df: pd.DataFrame, media_df: pd.DataFrame) -> pd.DataFrame:
    """
    Validate media matches by checking geographical and temporal plausibility.
    """
    print(f"Validating {len(media_matches_df)} media matches...")
    
    # Drop DINOv2 columns if they exist
    dinov2_cols = [col for col in media_matches_df.columns if 'dinov2' in col.lower()]
    if dinov2_cols:
        media_matches_df = media_matches_df.drop(columns=dinov2_cols)
    
    # Create lookup for GBIF occurrence data by key
    gbif_lookup = gbif_df.groupby('key').first()[['decimalLatitude', 'decimalLongitude', 'eventDate', 'identificationID', 'occurrenceID']].to_dict('index')
    
    # Create indexed media dataframe (miewid_matched_image_id is an index into this)
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
            query_key = row['key']
            matched_image_key = row.get('miewid_matched_image_id')
            
            # Get query occurrence data
            if query_key in gbif_lookup:
                query_data = gbif_lookup[query_key]
                lat1 = query_data['decimalLatitude']
                lon1 = query_data['decimalLongitude']
                time1 = query_data['eventDate']
                
                # Get matched image's key from media_df using the index
                if pd.notna(matched_image_key) and matched_image_key < len(media_df_indexed):
                    matched_image_row = media_df_indexed.iloc[int(matched_image_key)]
                    matched_key = matched_image_row['key']
                    
                    # Get matched occurrence data from GBIF
                    if matched_key in gbif_lookup:
                        matched_data = gbif_lookup[matched_key]
                        lat2 = matched_data['decimalLatitude']
                        lon2 = matched_data['decimalLongitude']
                        time2 = matched_data['eventDate']
                        
                        # Check if we have all required data
                        if pd.notna(lat1) and pd.notna(lon1) and pd.notna(time1) and \
                           pd.notna(lat2) and pd.notna(lon2) and pd.notna(time2):
                            
                            distance = haversine_distance(lat1, lon1, lat2, lon2)
                            speed = implied_speed_km_per_day(lat1, lon1, time1, lat2, lon2, time2)
                            plausibility = categorize_plausibility(speed, distance)
                            
                            # Calculate days between
                            if isinstance(time1, str):
                                t1 = datetime.fromisoformat(time1.split('T')[0])
                            else:
                                t1 = time1
                            if isinstance(time2, str):
                                t2 = datetime.fromisoformat(time2.split('T')[0])
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
    media_matches_df['matched_decimalLatitude'] = matched_lats
    media_matches_df['matched_decimalLongitude'] = matched_lons
    media_matches_df['matched_eventDate'] = matched_dates
    media_matches_df['distance_km'] = distances
    media_matches_df['days_between'] = days_between
    media_matches_df['implied_speed_km_per_day'] = speeds
    media_matches_df['plausibility'] = plausibilities
    
    # Remove duplicates based on image_id (each unique image should have its own row)
    media_matches_df = media_matches_df.drop_duplicates(subset=['image_id'], keep='first')
    
    print(f"Validation complete:")
    print(f"  PLAUSIBLE: {(media_matches_df['plausibility'] == 'PLAUSIBLE').sum()}")
    print(f"  UNCERTAIN: {(media_matches_df['plausibility'] == 'UNCERTAIN').sum()}")
    print(f"  IMPOSSIBLE: {(media_matches_df['plausibility'] == 'IMPOSSIBLE').sum()}")
    print(f"  UNKNOWN: {(media_matches_df['plausibility'] == 'UNKNOWN').sum()}")
    
    return media_matches_df


def explode_shark_matches_to_occurrences(shark_matches_df: pd.DataFrame, gbif_df: pd.DataFrame, media_matches_df: pd.DataFrame) -> pd.DataFrame:
    """
    Explode shark matches into individual image occurrences with validation.
    Each row in the output represents one image occurrence for a shark ID.
    """
    import re
    
    print(f"Exploding {len(shark_matches_df)} shark IDs into per-image occurrences...")
    
    # Create lookup for GBIF data
    gbif_lookup = gbif_df.groupby('identificationID').first()[['decimalLatitude', 'decimalLongitude', 'eventDate', 'occurrenceID', 'key']].to_dict('index')
    
    # Create lookup from key to image_id
    key_to_image_id = dict(zip(media_matches_df['key'], media_matches_df['image_id']))
    
    # Parse the MIEWID column to extract all matches
    # Format: "MIEWID: {shark_id} ({image_id}, {distance}), MIEWID: ..."
    def parse_miewid_matches(formatted_str):
        if pd.isna(formatted_str) or formatted_str == "":
            return []
        # Find all MIEWID patterns
        pattern = r'MIEWID:\s*([^\(]+)\s*\(([^,]+),\s*([^\)]+)\)'
        matches = re.findall(pattern, formatted_str)
        return [(m[0].strip(), m[1].strip(), float(m[2].strip())) for m in matches]
    
    exploded_rows = []
    
    for _, row in shark_matches_df.iterrows():
        shark_id = row['identificationID']
        miewid_col = row['MIEWID: closest_whale_shark_id (matched_image_id, distance)']
        
        # Get shark's own data
        if shark_id not in gbif_lookup:
            continue
        
        shark_data = gbif_lookup[shark_id]
        lat1 = shark_data['decimalLatitude']
        lon1 = shark_data['decimalLongitude']
        time1 = shark_data['eventDate']
        
        # Parse all matched IDs
        matched_ids = parse_miewid_matches(miewid_col)
        
        if not matched_ids:
            # No matches - create a single row with UNKNOWN
            query_key = shark_data.get('key')
            exploded_rows.append({
                'whaleSharkID': row.get('whaleSharkID', shark_id),
                'identificationID': shark_id,
                'occurrenceID': shark_data.get('occurrenceID'),
                'key': query_key,
                'image_id': key_to_image_id.get(query_key, -1),
                'decimalLatitude': lat1,
                'decimalLongitude': lon1,
                'eventDate': time1,
                'Oldest Occurrence': row.get('Oldest Occurrence'),
                'Newest Occurrence': row.get('Newest Occurrence'),
                'country (year)': row.get('country (year)'),
                'stateProvince - verbatimLocality (month year)': row.get('stateProvince - verbatimLocality (month year)'),
                'matched_shark_id': np.nan,
                'matched_image_id': np.nan,
                'match_distance': np.nan,
                'matched_decimalLatitude': np.nan,
                'matched_decimalLongitude': np.nan,
                'matched_eventDate': np.nan,
                'distance_km': np.nan,
                'days_between': np.nan,
                'implied_speed_km_per_day': np.nan,
                'plausibility': 'UNKNOWN'
            })
            continue
        
        # Create a row for each matched image
        for matched_shark_id, matched_image_id, match_distance in matched_ids:
            # Initialize with defaults
            distance = np.nan
            speed = np.nan
            days_diff = np.nan
            plausibility = "UNKNOWN"
            lat2 = np.nan
            lon2 = np.nan
            time2 = np.nan
            
            try:
                # Get matched shark data
                if matched_shark_id in gbif_lookup:
                    matched_data = gbif_lookup[matched_shark_id]
                    lat2 = matched_data['decimalLatitude']
                    lon2 = matched_data['decimalLongitude']
                    time2 = matched_data['eventDate']
                    
                    # Calculate validation metrics if we have all data
                    if pd.notna(lat1) and pd.notna(lon1) and pd.notna(time1) and \
                       pd.notna(lat2) and pd.notna(lon2) and pd.notna(time2):
                        
                        distance = haversine_distance(lat1, lon1, lat2, lon2)
                        speed = implied_speed_km_per_day(lat1, lon1, time1, lat2, lon2, time2)
                        plausibility = categorize_plausibility(speed, distance)
                        
                        # Calculate days between
                        if isinstance(time1, str):
                            t1 = datetime.fromisoformat(time1.split('T')[0])
                        else:
                            t1 = time1
                        if isinstance(time2, str):
                            t2 = datetime.fromisoformat(time2.split('T')[0])
                        else:
                            t2 = time2
                        days_diff = abs((t2 - t1).days)
                        
                        distance = round(distance, 2)
                        speed = round(speed, 2) if not np.isinf(speed) else 999999.0
            
            except Exception as e:
                print(f"Error processing match for {shark_id} -> {matched_shark_id}: {e}")
                plausibility = "ERROR"
            
            query_key = shark_data.get('key')
            exploded_rows.append({
                'whaleSharkID': row.get('whaleSharkID', shark_id),
                'identificationID': shark_id,
                'occurrenceID': shark_data.get('occurrenceID'),
                'key': query_key,
                'image_id': key_to_image_id.get(query_key, -1),
                'decimalLatitude': lat1,
                'decimalLongitude': lon1,
                'eventDate': time1,
                'Oldest Occurrence': row.get('Oldest Occurrence'),
                'Newest Occurrence': row.get('Newest Occurrence'),
                'country (year)': row.get('country (year)'),
                'stateProvince - verbatimLocality (month year)': row.get('stateProvince - verbatimLocality (month year)'),
                'matched_shark_id': matched_shark_id,
                'matched_image_id': int(matched_image_id),
                'match_distance': match_distance,
                'matched_decimalLatitude': lat2,
                'matched_decimalLongitude': lon2,
                'matched_eventDate': time2,
                'distance_km': distance,
                'days_between': days_diff,
                'implied_speed_km_per_day': speed,
                'plausibility': plausibility
            })
    
    result_df = pd.DataFrame(exploded_rows)
    
    print(f"Created {len(result_df)} image occurrence rows from {len(shark_matches_df)} shark IDs")
    print(f"Validation summary:")
    print(f"  PLAUSIBLE: {(result_df['plausibility'] == 'PLAUSIBLE').sum()}")
    print(f"  UNCERTAIN: {(result_df['plausibility'] == 'UNCERTAIN').sum()}")
    print(f"  IMPOSSIBLE: {(result_df['plausibility'] == 'IMPOSSIBLE').sum()}")
    print(f"  UNKNOWN: {(result_df['plausibility'] == 'UNKNOWN').sum()}")
    
    return result_df


def validate_shark_matches(shark_matches_df: pd.DataFrame, gbif_df: pd.DataFrame) -> pd.DataFrame:
    """
    Validate shark ID matches by checking geographical and temporal plausibility.
    """
    print(f"Validating {len(shark_matches_df)} shark ID matches...")
    
    # Drop DINOv2 columns if they exist
    dinov2_cols = [col for col in shark_matches_df.columns if 'dinov2' in col.lower()]
    if dinov2_cols:
        shark_matches_df = shark_matches_df.drop(columns=dinov2_cols)
    
    # Create lookup for GBIF data
    # Handle duplicate identificationIDs by keeping first occurrence per ID
    gbif_lookup = gbif_df.groupby('identificationID').first()[['decimalLatitude', 'decimalLongitude', 'eventDate']].to_dict('index')
    
    # Extract matched shark ID from the formatted string
    # Format: "MIEWID: {shark_id} ({image_id}, {distance})"
    import re
    def extract_matched_id(formatted_str):
        if pd.isna(formatted_str):
            return None
        match = re.search(r'MIEWID:\\s*([^\\(]+)', formatted_str)
        if match:
            return match.group(1).strip()
        return None
    
    shark_matches_df['matched_shark_id'] = shark_matches_df['MIEWID: closest_whale_shark_id (matched_image_id, distance)'].apply(extract_matched_id)
    
    # Calculate distance, speed, days between, and plausibility
    distances = []
    speeds = []
    days_between = []
    plausibilities = []
    matched_lats = []
    matched_lons = []
    matched_dates = []
    
    for _, row in shark_matches_df.iterrows():
        try:
            shark_id = row['identificationID']
            matched_id = row['matched_shark_id']
            
            # Get query shark data
            if shark_id not in gbif_lookup:
                distances.append(np.nan)
                speeds.append(np.nan)
                days_between.append(np.nan)
                plausibilities.append("UNKNOWN")
                matched_lats.append(np.nan)
                matched_lons.append(np.nan)
                matched_dates.append(np.nan)
                continue
            
            shark_data = gbif_lookup[shark_id]
            lat1 = shark_data['decimalLatitude']
            lon1 = shark_data['decimalLongitude']
            time1 = shark_data['eventDate']
            
            # Get matched shark data
            if pd.isna(matched_id) or matched_id not in gbif_lookup:
                distances.append(np.nan)
                speeds.append(np.nan)
                days_between.append(np.nan)
                plausibilities.append("UNKNOWN")
                matched_lats.append(np.nan)
                matched_lons.append(np.nan)
                matched_dates.append(np.nan)
                continue
            
            matched_data = gbif_lookup[matched_id]
            lat2 = matched_data['decimalLatitude']
            lon2 = matched_data['decimalLongitude']
            time2 = matched_data['eventDate']
            
            matched_lats.append(lat2)
            matched_lons.append(lon2)
            matched_dates.append(time2)
            
            if pd.notna(lat1) and pd.notna(lon1) and pd.notna(time1) and \
               pd.notna(lat2) and pd.notna(lon2) and pd.notna(time2):
                
                distance = haversine_distance(lat1, lon1, lat2, lon2)
                speed = implied_speed_km_per_day(lat1, lon1, time1, lat2, lon2, time2)
                plausibility = categorize_plausibility(speed, distance)
                
                # Calculate days between
                if isinstance(time1, str):
                    t1 = datetime.fromisoformat(time1.split('T')[0])
                else:
                    t1 = time1
                if isinstance(time2, str):
                    t2 = datetime.fromisoformat(time2.split('T')[0])
                else:
                    t2 = time2
                days_diff = abs((t2 - t1).days)
                
                distances.append(round(distance, 2))
                speeds.append(round(speed, 2) if not np.isinf(speed) else 999999.0)
                days_between.append(days_diff)
                plausibilities.append(plausibility)
            else:
                distances.append(np.nan)
                speeds.append(np.nan)
                days_between.append(np.nan)
                plausibilities.append("UNKNOWN")
                
        except Exception as e:
            print(f"Error validating row: {e}")
            distances.append(np.nan)
            speeds.append(np.nan)
            days_between.append(np.nan)
            plausibilities.append("ERROR")
            matched_lats.append(np.nan)
            matched_lons.append(np.nan)
            matched_dates.append(np.nan)
    
    # Add validation columns
    shark_matches_df['matched_decimalLatitude'] = matched_lats
    shark_matches_df['matched_decimalLongitude'] = matched_lons
    shark_matches_df['matched_eventDate'] = matched_dates
    shark_matches_df['distance_km'] = distances
    shark_matches_df['days_between'] = days_between
    shark_matches_df['implied_speed_km_per_day'] = speeds
    shark_matches_df['plausibility'] = plausibilities
    
    # Remove duplicates based on identificationID
    shark_matches_df = shark_matches_df.drop_duplicates(subset=['identificationID'], keep='first')
    
    # Clean up temporary columns
    shark_matches_df = shark_matches_df.drop(columns=['matched_shark_id'], errors='ignore')
    
    print(f"Validation complete:")
    print(f"  PLAUSIBLE: {(shark_matches_df['plausibility'] == 'PLAUSIBLE').sum()}")
    print(f"  UNCERTAIN: {(shark_matches_df['plausibility'] == 'UNCERTAIN').sum()}")
    print(f"  IMPOSSIBLE: {(shark_matches_df['plausibility'] == 'IMPOSSIBLE').sum()}")
    print(f"  UNKNOWN: {(shark_matches_df['plausibility'] == 'UNKNOWN').sum()}")
    
    return shark_matches_df


if __name__ == "__main__":
    # Load GBIF clean data for coordinates and dates
    print("Loading GBIF clean data...")
    gbif_df = read_csv(GBIF_CLEAN_CSV)
    
    # Load GBIF media data (needed to map miewid_matched_image_id back to keys)
    print("Loading GBIF media data...")
    media_df = read_csv(GBIF_MEDIA_CSV)
    
    # Load media matches
    print("Loading media matches...")
    media_matches_file = f"{NEW_EMBEDDINGS_FOLDER}/GBIF_media_matches.csv"
    media_matches_df = read_csv(media_matches_file)
    
    # Validate media matches
    validated_media_df = validate_media_matches(media_matches_df, gbif_df, media_df)
    
    # Export media matches
    print(f"Exporting validated media matches to CSV and JSON...")
    export_to_csv(VALIDATED_MEDIA_MATCHES_FILE, validated_media_df)
    export_to_json(VALIDATED_MEDIA_MATCHES_JSON, validated_media_df)
    
    # Load shark ID matches
    print("Loading shark ID matches...")
    shark_matches_file = f"{NEW_EMBEDDINGS_FOLDER}/GBIF_shark_matches.csv"
    shark_matches_df = read_csv(shark_matches_file)
    
    # Validate shark ID matches (legacy format)
    validated_shark_df = validate_shark_matches(shark_matches_df, gbif_df)
    
    # Drop unnecessary columns before exporting
    columns_to_drop = ['matched_decimalLatitude', 'matched_decimalLongitude', 'matched_eventDate', 
                       'distance_km', 'days_between', 'implied_speed_km_per_day', 'plausibility']
    shark_df_for_export = validated_shark_df.drop(columns=columns_to_drop, errors='ignore')
    
    # Export shark ID matches
    print(f"Exporting validated shark ID matches to CSV and JSON...")
    export_to_csv(VALIDATED_SHARK_MATCHES_FILE, shark_df_for_export)
    export_to_json(VALIDATED_SHARK_MATCHES_JSON, shark_df_for_export)
    
    # Create exploded per-image occurrence file
    print("\nCreating per-image occurrence file...")
    exploded_df = explode_shark_matches_to_occurrences(shark_matches_df, gbif_df, validated_media_df)
    
    # Export exploded data
    exploded_csv = f"{NEW_EMBEDDINGS_FOLDER}/GBIF_shark_image_occurrences_validated.csv"
    exploded_json = "./website/src/assets/data/json/GBIF_shark_image_occurrences_validated.json"
    print(f"Exporting per-image occurrences to CSV and JSON...")
    export_to_csv(exploded_csv, exploded_df)
    export_to_json(exploded_json, exploded_df)
    
    print("\nValidation complete!")
    print(f"  Media matches: {VALIDATED_MEDIA_MATCHES_FILE}")
    print(f"  Shark ID matches: {VALIDATED_SHARK_MATCHES_FILE}")
    print(f"  Shark image occurrences: {exploded_csv}")
