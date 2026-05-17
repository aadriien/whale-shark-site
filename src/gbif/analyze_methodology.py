###############################################################################
##  `analyze_methodology.py`                                                 ##
##                                                                           ##
##  Purpose: Classifies observation methodology & ID patterns per occurrence ##
##           and aggregates them per individual shark                        ##
###############################################################################


import re

import pandas as pd

# ─────────────────────────────────────────────────────────────────────────────
# Classification constants
# ─────────────────────────────────────────────────────────────────────────────

# basisOfRecord values that resolve directly without further inspection
BASIS_TO_METHODOLOGY = {
    "PRESERVED_SPECIMEN": "Museum Specimen",
    "FOSSIL_SPECIMEN": "Fossil",
    "MATERIAL_SAMPLE": "Genetic Sample",
    "OCCURRENCE": "Literature Record",
    "MATERIAL_CITATION": "Literature Record",
    "OBSERVATION": "Historical Observation",
}

# (upper_bound_exclusive, label) — evaluated finest to coarsest.
# 111,319 m is a 1-degree cell (aggregated telemetry), lands in Coarse.
COORD_PRECISION_BINS = [
    (100, "GPS (<100 m)"),
    (1_000, "Precise (100 m–1 km)"),
    (50_000, "Moderate (1–50 km)"),
]
COORD_PRECISION_COARSE = "Coarse (>50 km)"
COORD_PRECISION_UNKNOWN = "Unknown"


# ─────────────────────────────────────────────────────────────────────────────
# Per-occurrence classifiers
# ─────────────────────────────────────────────────────────────────────────────


def classify_methodology(row: pd.Series) -> str:
    """
    Classify a single occurrence into a tracking / observation methodology.

    Priority: basisOfRecord → telemetry sub-type → photo-ID platform.

    MACHINE_OBSERVATION sub-types (in priority order):
      Aggregated Telemetry  occurrenceRemarks states 1-degree cell aggregation
      Acoustic Tag          IMOS ATF collectionCode or VEMCO A69 serial pattern
      SPOT Satellite Tag    "Shark ID:" remarks or "-track-" eventID convention
      Satellite Tag         other machine telemetry not matched above

    HUMAN_OBSERVATION sub-types:
      Photo-ID (iNaturalist)       occurrenceID links to inaturalist.org
      Photo-ID (Citizen Science)   occurrenceID links to observation.org
      Photo-ID (Human Observation) all other human sightings
    """
    basis = str(row.get("basisOfRecord") or "")
    remarks = str(row.get("occurrenceRemarks") or "")
    coll = str(row.get("collectionCode") or "")
    event = str(row.get("eventID") or "")
    sid = str(row.get("whaleSharkID") or "")
    occ_id = str(row.get("occurrenceID") or "")

    if basis in BASIS_TO_METHODOLOGY:
        return BASIS_TO_METHODOLOGY[basis]

    if basis == "MACHINE_OBSERVATION":
        if "aggregated per species per 1-degree cell" in remarks:
            return "Aggregated Telemetry"
        # IMOS_ATF is the IMOS Animal Tracking Facility collectionCode;
        # A69-\d+-\d+ is the VEMCO acoustic pinger hardware serial format
        if "IMOS_ATF" in coll or re.fullmatch(r"A69-\d+-\d+", sid):
            return "Acoustic Tag"
        # "Shark ID:" remarks and "-track-" eventIDs are a publishing convention
        # used by several Australian SPOT satellite tagging programs
        if "-track-" in event or remarks.startswith("Shark ID:"):
            return "SPOT Satellite Tag"
        return "Satellite Tag"

    if basis == "HUMAN_OBSERVATION":
        if "inaturalist.org" in occ_id.lower():
            return "Photo-ID (iNaturalist)"
        if "observation.org" in occ_id.lower():
            return "Photo-ID (Citizen Science)"
        return "Photo-ID (Human Observation)"

    return "Unknown"


def classify_id_pattern(shark_id: str) -> str:
    """
    Classify the structural format of a whaleSharkID string.

    Patterns describe format only — not assumed program origin — since the
    same format may be reused across different research groups or regions.
    Checked from most specific to most general to avoid false positives.

    Structural patterns currently present in the dataset:
      Acoustic Tag Serial (VEMCO)  A69-XXXX-XXXXX
          hardware serial (specific to VEMCO model line)
      Satellite Tag Code           [Letter]-NNN
          letter-prefixed tag codes (A-, X-, M-, etc.)
      Photo-ID Survey Code         YYYY_[Code]NNN  year-prefixed field survey IDs
      Platform Observation ID      9+ digits
          per-observation IDs from citizen science platforms
      Database Record ID           4-8 digits
          deployment or tracking database internal references
      Named Individual             alpha string    researcher-assigned name
      Researcher-Assigned Code     anything else
          local codes not matching known formats
    """
    if not shark_id or shark_id in ("nan", "None", ""):
        return "Unknown"

    # VEMCO acoustic hardware serial — format is model-specific and globally consistent
    if re.fullmatch(r"A69-\d+-\d+", shark_id):
        return "Acoustic Tag Serial (VEMCO)"

    # Single-letter prefix + digits: A-NNN, X-NNN, M-NNN, etc.
    if re.fullmatch(r"[A-Z]-\d+", shark_id):
        return f"Satellite Tag Code ({shark_id[0]}-Series)"

    # Year-prefixed field survey codes: e.g. 2022_WS117
    if re.fullmatch(r"\d{4}_[A-Z]+\d+", shark_id):
        return "Photo-ID Survey Code"

    # 9+ digit IDs are typically per-observation platform IDs (e.g. iNaturalist),
    # NOT individual animal IDs — each sighting gets a new unique number
    if re.fullmatch(r"\d{9,}", shark_id):
        return "Platform Observation ID"

    # 4–8 digit numerics are typically internal deployment or database record refs
    if re.fullmatch(r"\d{4,8}", shark_id):
        return "Database Record ID"

    # All-alpha (with spaces/hyphens/apostrophes): researcher-assigned name
    if re.fullmatch(r"[A-Za-z][A-Za-z\s\-']*", shark_id):
        return "Named Individual"

    return "Researcher-Assigned Code"


# ─────────────────────────────────────────────────────────────────────────────
# Occurrence-level annotation
# ─────────────────────────────────────────────────────────────────────────────


def annotate_occurrences(occurrences_df: pd.DataFrame) -> pd.DataFrame:
    """
    Adds per-row methodology columns to the occurrences DataFrame.

    Called once in analyze.py so the enriched DataFrame flows into all
    downstream analysis functions.  Two columns are added:

      trackingMethodology  how this occurrence was observed / collected
      idPattern            structural format of the whaleSharkID
    """
    df = occurrences_df.copy()
    df["trackingMethodology"] = df.apply(classify_methodology, axis=1)
    df["idPattern"] = (
        df["whaleSharkID"].fillna("").astype(str).apply(classify_id_pattern)
    )
    return df


# ─────────────────────────────────────────────────────────────────────────────
# Per-shark aggregation  (called from analyze_individuals)
# ─────────────────────────────────────────────────────────────────────────────


def _classify_single_precision(uncertainty_m) -> str:
    if pd.isna(uncertainty_m):
        return COORD_PRECISION_UNKNOWN
    for threshold, label in COORD_PRECISION_BINS:
        if uncertainty_m < threshold:
            return label
    return COORD_PRECISION_COARSE


def assemble_methodology_metrics(
    occurrences_df: pd.DataFrame, individual_sharks: pd.DataFrame
) -> pd.DataFrame:
    """
    Enriches the individual_sharks summary with methodology-derived columns.

    Added columns:
      trackingMethodologies  unique methods seen across all occurrences for
                             this shark, alphabetically sorted and comma-joined
      idPattern              structural format of this shark's whaleSharkID
      coordinatePrecision    all unique coordinate precision levels across this
                             shark's occurrences, sorted and comma-joined

    No occurrences are dropped. All three columns are purely additive metadata.

    Requires occurrences_df to contain a 'trackingMethodology' column
    (i.e. annotate_occurrences() was called upstream in analyze.py).
    Falls back to calling annotate_occurrences() here if the column is absent.

    By the time this is called in export_individual_shark_stats, all prior
    merge operations have promoted whaleSharkID from index to column,
    so individual_sharks["whaleSharkID"] is safe to reference directly.
    """
    if "trackingMethodology" not in occurrences_df.columns:
        occurrences_df = annotate_occurrences(occurrences_df)

    individual_sharks = individual_sharks.copy()

    # Unique methodologies per shark, alphabetically sorted for consistency
    methodologies = (
        occurrences_df.dropna(subset=["whaleSharkID", "trackingMethodology"])
        .groupby("whaleSharkID")["trackingMethodology"]
        .apply(lambda x: ", ".join(sorted(set(x))))
        .rename("trackingMethodologies")
        .reset_index()
    )
    individual_sharks = individual_sharks.merge(
        methodologies, on="whaleSharkID", how="left"
    )
    individual_sharks["trackingMethodologies"] = individual_sharks[
        "trackingMethodologies"
    ].fillna("Unknown")

    # idPattern is derivable from whaleSharkID alone — no merge needed
    shark_id_col = (
        individual_sharks["whaleSharkID"]
        if "whaleSharkID" in individual_sharks.columns
        else individual_sharks.index.to_series()
    )
    individual_sharks["idPattern"] = (
        shark_id_col.fillna("").astype(str).apply(classify_id_pattern)
    )

    # All unique precision levels across a shark's occurrences (no filtering)
    coord_precision = (
        occurrences_df.dropna(subset=["whaleSharkID"])
        .assign(
            precLevel=lambda df: df["coordinateUncertaintyInMeters"].apply(
                _classify_single_precision
            )
        )
        .groupby("whaleSharkID")["precLevel"]
        .apply(lambda x: ", ".join(sorted(set(x))))
        .rename("coordinatePrecision")
        .reset_index()
    )
    individual_sharks = individual_sharks.merge(
        coord_precision, on="whaleSharkID", how="left"
    )
    individual_sharks["coordinatePrecision"] = individual_sharks[
        "coordinatePrecision"
    ].fillna(COORD_PRECISION_UNKNOWN)

    return individual_sharks
