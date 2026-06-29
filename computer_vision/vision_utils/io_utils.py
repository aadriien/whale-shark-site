###############################################################################
##  `io_utils.py`                                                            ##
##                                                                           ##
##  Purpose: Shared I/O utilities for exporting data (JSON, CSV summaries)   ##
##           and loading GBIF media records used across the CV pipeline.     ##
###############################################################################


import json
import unicodedata

import pandas as pd
from src.gbif.clean import GBIF_MEDIA_CSV
from src.utils.data_utils import read_csv


def normalize_string(s):
    if not isinstance(s, str):
        return s

    # Normalize unicode to decomposed form, then encode to ASCII
    normalized = unicodedata.normalize("NFKD", s)
    return normalized.encode("ascii", "ignore").decode("ascii")


def export_to_json(filepath: str, df: pd.DataFrame) -> None:
    data = df.to_dict("records")

    # Normalize string values to handle accents & special characters
    normalized_data = []

    for record in data:
        normalized_record = {}

        for key, value in record.items():
            # Normalize both keys & values
            normalized_key = normalize_string(key)

            if pd.isna(value):
                # Use None so JSON becomes null
                normalized_record[normalized_key] = None
            elif isinstance(value, str):
                normalized_record[normalized_key] = normalize_string(value)
            else:
                normalized_record[normalized_key] = value

        normalized_data.append(normalized_record)

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(normalized_data, f, indent=2, default=str, ensure_ascii=True)

    print(f"Exported {len(normalized_data)} records to {filepath}")


def format_match_summary(
    media_matches_df: pd.DataFrame, label: str, prefix: str
) -> pd.DataFrame:
    # Groups per-image matches into a single "{label}: shark (image_id, distance)"
    # summary string per whaleSharkID, for the given column family (e.g. "miewid_gbif")
    fmt = label + ": {0} ({1}, {2})"
    cols = [
        f"{prefix}_closest_whale_shark_id",
        f"{prefix}_matched_image_id",
        f"{prefix}_distance",
    ]
    colname = f"{label}: closest_whale_shark_id (matched_image_id, distance)"

    return (
        media_matches_df.groupby("whaleSharkID")
        .apply(
            lambda x: ", ".join(
                sorted(
                    set(fmt.format(*vals) for vals in zip(*(x[col] for col in cols)))
                )
            ),
            include_groups=False,
        )
        .reset_index(name=colname)
    )


def get_image_records() -> pd.DataFrame:
    media_df = read_csv(
        GBIF_MEDIA_CSV, dtype={"key": str, "whaleSharkID": str, "identificationID": str}
    )

    # Keep only relevant columns
    RELEVANT_COLUMNS = [
        "key",  # maps to key in regular GBIF occurrence dataset
        "whaleSharkID",
        "occurrenceID",
        "identificationID",
        "format",
        "references",
        "identifier",  # image URL (often in AWS S3 bucket)
    ]
    media_df = media_df[RELEVANT_COLUMNS]

    # Enforce essential fields for embedding
    REQUIRED_FOR_EMBEDDING = ["key", "whaleSharkID", "identifier"]
    media_df_clean = media_df.dropna(subset=REQUIRED_FOR_EMBEDDING)
    media_df_clean.reset_index(drop=True, inplace=True)

    return media_df_clean
