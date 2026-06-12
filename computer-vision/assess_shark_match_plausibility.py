###############################################################################
##  `assess_shark_match_plausibility.py`                                     ##
##                                                                           ##
##  Purpose: Maps each whaleSharkID to the set of other whaleSharkIDs it     ##
##           CANNOT be, based on geographic/temporal plausibility            ##
###############################################################################


from datetime import datetime
from typing import Dict, Set

import numpy as np
import pandas as pd
from src.gbif.constants import GBIF_CLEAN_CSV
from src.utils.data_utils import read_csv

from .calculate_coordinate_distance import calculate_distance_matrix


def _event_date_to_ordinal(date_value) -> float:
    if pd.isna(date_value):
        return np.nan
    try:
        return float(datetime.fromisoformat(str(date_value).split("T")[0]).toordinal())
    except ValueError:
        # Partial dates (e.g. year-only) lack the specificity to place an
        # occurrence on a timeline, so they're excluded from the matrix
        return np.nan


def build_exclusion_map(
    gbif_df: pd.DataFrame, vmax: float = 200.0
) -> Dict[str, Set[str]]:
    """
    For every pair of whaleSharkIDs, determine whether the implied travel
    speed between their (first) occurrences exceeds the biologically
    plausible maximum (vmax, km/day), i.e. they CANNOT be the same shark.

    Returns a sparse map: whaleSharkID -> set of whaleSharkIDs it CAN'T be.
    Sharks with no IMPOSSIBLE pairings (including those with missing/partial
    geo or date data) are simply absent from the map.
    """
    first = gbif_df.groupby("whaleSharkID").first().reset_index()
    first["whaleSharkID"] = first["whaleSharkID"].astype(str)

    valid = first.dropna(
        subset=["decimalLatitude", "decimalLongitude", "eventDate"]
    ).copy()
    valid["_ordinal"] = valid["eventDate"].apply(_event_date_to_ordinal)
    valid = valid.dropna(subset=["_ordinal"])

    if valid.empty:
        return {}

    ids = valid["whaleSharkID"].to_numpy()
    lat = valid["decimalLatitude"].to_numpy(dtype=float)
    lon = valid["decimalLongitude"].to_numpy(dtype=float)
    days = valid["_ordinal"].to_numpy(dtype=float)

    # Ocean-routed distance (km) between every pair of sharks
    distance = calculate_distance_matrix(lat, lon, use_searoute=True)

    # Implied travel speed (km/day) between every pair of sharks
    delta_days = np.abs(days[:, None] - days[None, :])
    with np.errstate(divide="ignore", invalid="ignore"):
        speed = distance / delta_days

    # Mirrors categorize_plausibility's IMPOSSIBLE case, including the
    # same-day-but-far-apart exception (infinite speed, distance >= 10km)
    impossible = (speed > vmax) & ~(np.isinf(speed) & (distance < 10))
    np.fill_diagonal(impossible, False)

    exclusion_map: Dict[str, Set[str]] = {}
    for i, shark_id in enumerate(ids):
        excluded = ids[impossible[i]]
        if excluded.size:
            exclusion_map[shark_id] = set(excluded.tolist())

    return exclusion_map


if __name__ == "__main__":
    print("Loading GBIF clean data...")
    gbif_df = read_csv(GBIF_CLEAN_CSV)

    exclusion_map = build_exclusion_map(gbif_df)

    total_sharks = gbif_df["whaleSharkID"].nunique()
    sharks_with_exclusions = len(exclusion_map)
    total_exclusions = sum(len(v) for v in exclusion_map.values())

    print(f"Total sharks: {total_sharks}")
    print(f"Sharks with at least one IMPOSSIBLE pairing: {sharks_with_exclusions}")
    print(f"Total excluded pairings (directional): {total_exclusions}")
