###############################################################################
##  `match_plausible_embeddings.py`                                          ##
##                                                                           ##
##  Purpose: Mirrors match_embeddings.py, but excludes candidates that are   ##
##           geographically/temporally IMPOSSIBLE matches for a given shark. ##
##           Output powers build_graph.py; the unfiltered match_embeddings   ##
##           output continues to power the SharkMatchViewer (with its own    ##
##           per-match plausibility flag from validate_embeddings.py).       ##
###############################################################################


import numpy as np
import pandas as pd
from src.gbif.constants import GBIF_CLEAN_CSV, GBIF_INDIVIDUAL_SHARKS_STATS_CSV
from src.utils.data_utils import export_to_csv, read_csv

from ..root_constants import (
    GBIF_OUTPUT_NPZ_FILE,
    OUTPUT_NPZ_FILE,
)
from ..vision_utils.embedding_utils import perform_search
from ..vision_utils.io_utils import (
    export_to_json,
    format_match_summary,
    get_image_records,
)
from ..vision_utils.plausibility_utils import build_exclusion_map
from ..vision_utils.shark_matching_utils import find_first_different_shark
from .plausible_matching_constants import (
    GBIF_PLAUSIBLE_INDIVIDUAL_MATCHES_FILE,
    GBIF_PLAUSIBLE_INDIVIDUAL_MATCHES_JSON,
    GBIF_PLAUSIBLE_MEDIA_MATCHES_FILE,
    GBIF_PLAUSIBLE_MEDIA_MATCHES_JSON,
)


def identify_sharks(
    known_data: dict, new_data: dict, exclusion_map: dict[str, set[str]]
) -> list[dict]:
    query_miewid = new_data["miewid_embeddings"]
    query_dino = new_data["dinov2_embeddings"]
    query_ids = new_data["whaleSharkIDs"].astype(str)

    known_miewid = known_data["miewid_embeddings"]
    known_dino = known_data["dinov2_embeddings"]
    known_names = known_data["whale_shark_names"].astype(str)
    known_image_ids = known_data["image_ids"]
    known_annotation_ids = known_data["annotation_ids"]

    # Closest match within GBIF: search the GBIF set against itself.
    # A shark can have many of its own images ranked first, so scan deep
    # enough (k=50) to find the first genuinely different, plausible shark.
    gbif_dist_miewid, gbif_idx_miewid = perform_search(query_miewid, query_miewid, k=50)
    gbif_dist_dino, gbif_idx_dino = perform_search(query_dino, query_dino, k=50)

    # Closest match within Ningaloo: search the Ningaloo source-of-truth set.
    # Ningaloo names live in a different ID namespace than GBIF whaleSharkIDs,
    # so the exclusion map (keyed by GBIF whaleSharkIDs) never matches here.
    # These searches are effectively unfiltered, same as match_embeddings.py.
    ningaloo_dist_miewid, ningaloo_idx_miewid = perform_search(
        known_miewid, query_miewid, k=5
    )
    ningaloo_dist_dino, ningaloo_idx_dino = perform_search(known_dino, query_dino, k=5)

    results = []
    for i in range(len(query_miewid)):
        current_shark_id = query_ids[i]
        excluded_ids = exclusion_map.get(current_shark_id, set())

        idx_gbif_miewid, dist_gbif_miewid = find_first_different_shark(
            gbif_idx_miewid[i],
            gbif_dist_miewid[i],
            query_ids,
            current_shark_id,
            excluded_ids,
            exclude_index=i,
        )
        idx_gbif_dino, dist_gbif_dino = find_first_different_shark(
            gbif_idx_dino[i],
            gbif_dist_dino[i],
            query_ids,
            current_shark_id,
            excluded_ids,
            exclude_index=i,
        )
        idx_ningaloo_miewid, dist_ningaloo_miewid = find_first_different_shark(
            ningaloo_idx_miewid[i],
            ningaloo_dist_miewid[i],
            known_names,
            current_shark_id,
            set(),
        )
        idx_ningaloo_dino, dist_ningaloo_dino = find_first_different_shark(
            ningaloo_idx_dino[i],
            ningaloo_dist_dino[i],
            known_names,
            current_shark_id,
            set(),
        )

        result = {
            "image_id": i,  # renamed from query_index for clarity
            # MIEWID - closest plausible match within GBIF (new_data)
            "miewid_gbif_closest_whale_shark_id": (
                query_ids[idx_gbif_miewid] if idx_gbif_miewid is not None else "N/A"
            ),
            "miewid_gbif_matched_image_id": (
                idx_gbif_miewid if idx_gbif_miewid is not None else -1
            ),
            "miewid_gbif_matched_annotation_id": (
                idx_gbif_miewid if idx_gbif_miewid is not None else -1
            ),
            "miewid_gbif_distance": (
                round(dist_gbif_miewid, 4) if dist_gbif_miewid is not None else 999.0
            ),
            # MIEWID - closest match within Ningaloo (known_data)
            "miewid_ningaloo_closest_whale_shark_id": (
                known_names[idx_ningaloo_miewid]
                if idx_ningaloo_miewid is not None
                else "N/A"
            ),
            "miewid_ningaloo_matched_image_id": (
                int(known_image_ids[idx_ningaloo_miewid])
                if idx_ningaloo_miewid is not None
                else -1
            ),
            "miewid_ningaloo_matched_annotation_id": (
                int(known_annotation_ids[idx_ningaloo_miewid])
                if idx_ningaloo_miewid is not None
                else -1
            ),
            "miewid_ningaloo_distance": (
                round(dist_ningaloo_miewid, 4)
                if dist_ningaloo_miewid is not None
                else 999.0
            ),
            # DINOv2 - closest plausible match within GBIF (new_data)
            "dinov2_gbif_closest_whale_shark_id": (
                query_ids[idx_gbif_dino] if idx_gbif_dino is not None else "N/A"
            ),
            "dinov2_gbif_matched_image_id": (
                idx_gbif_dino if idx_gbif_dino is not None else -1
            ),
            "dinov2_gbif_matched_annotation_id": (
                idx_gbif_dino if idx_gbif_dino is not None else -1
            ),
            "dinov2_gbif_distance": (
                round(dist_gbif_dino, 4) if dist_gbif_dino is not None else 999.0
            ),
            # DINOv2 - closest match within Ningaloo (known_data)
            "dinov2_ningaloo_closest_whale_shark_id": (
                known_names[idx_ningaloo_dino]
                if idx_ningaloo_dino is not None
                else "N/A"
            ),
            "dinov2_ningaloo_matched_image_id": (
                int(known_image_ids[idx_ningaloo_dino])
                if idx_ningaloo_dino is not None
                else -1
            ),
            "dinov2_ningaloo_matched_annotation_id": (
                int(known_annotation_ids[idx_ningaloo_dino])
                if idx_ningaloo_dino is not None
                else -1
            ),
            "dinov2_ningaloo_distance": (
                round(dist_ningaloo_dino, 4)
                if dist_ningaloo_dino is not None
                else 999.0
            ),
        }
        results.append(result)

    return results


def translate_npz_positions_to_image_ids(
    results_df: pd.DataFrame, new_data: dict, gbif_media_df: pd.DataFrame
) -> pd.DataFrame:
    # process_all_images() silently skips images that fail (download/YOLO
    # errors), so new_data's arrays are a compacted subsequence of
    # get_image_records(): npz position i doesn't generally correspond to
    # image_id i. Recover the true image_id for each npz position via the
    # GBIF media key recorded alongside each embedding.
    # A single GBIF `key` (occurrence record) can bundle many photos, so
    # `key` alone isn't unique per image. Pair it with `identifier`
    # (photo URL), which together uniquely identify a gbif_media_df row.
    key_to_image_id = dict(
        zip(
            zip(
                gbif_media_df["key"].astype(str),
                gbif_media_df["identifier"].astype(str),
            ),
            gbif_media_df["image_id"],
        )
    )
    npz_pos_to_image_id = {
        i: int(key_to_image_id[(key, identifier)])
        for i, (key, identifier) in enumerate(
            zip(
                new_data["image_id_keys"].astype(str),
                new_data["image_url_identifiers"].astype(str),
            )
        )
        if (key, identifier) in key_to_image_id
    }

    def translate(npz_pos) -> int:
        npz_pos = int(npz_pos)
        return npz_pos_to_image_id.get(npz_pos, -1) if npz_pos >= 0 else -1

    for col in [
        "image_id",
        "miewid_gbif_matched_image_id",
        "miewid_gbif_matched_annotation_id",
        "dinov2_gbif_matched_image_id",
        "dinov2_gbif_matched_annotation_id",
    ]:
        results_df[col] = results_df[col].apply(translate)

    return results_df


def validate_matches(media_matches_df: pd.DataFrame) -> None:
    media_sharks_df = read_csv(GBIF_INDIVIDUAL_SHARKS_STATS_CSV)

    RELEVANT_COLUMNS = [
        "whaleSharkID",
        "identificationID",
        "Oldest Occurrence",
        "Newest Occurrence",
        "country (year)",
        "stateProvince - verbatimLocality (month year)",
    ]
    media_sharks_df = media_sharks_df[RELEVANT_COLUMNS]
    individual_sharks = media_sharks_df.dropna(subset=["whaleSharkID"]).copy()
    individual_sharks.reset_index(drop=True, inplace=True)

    individual_sharks["whaleSharkID"] = individual_sharks["whaleSharkID"].astype(str)
    media_matches_df["whaleSharkID"] = media_matches_df["whaleSharkID"].astype(str)

    # --- Format & group each match column family into its own summary ---
    summaries = [
        format_match_summary(media_matches_df, "MIEWID GBIF", "miewid_gbif"),
        format_match_summary(media_matches_df, "MIEWID NINGALOO", "miewid_ningaloo"),
        format_match_summary(media_matches_df, "DINOV2 GBIF", "dinov2_gbif"),
        format_match_summary(media_matches_df, "DINOV2 NINGALOO", "dinov2_ningaloo"),
    ]

    for summary_df in summaries:
        individual_sharks = individual_sharks.merge(
            summary_df, on="whaleSharkID", how="left"
        )

    export_to_csv(GBIF_PLAUSIBLE_INDIVIDUAL_MATCHES_FILE, individual_sharks)
    export_to_json(GBIF_PLAUSIBLE_INDIVIDUAL_MATCHES_JSON, individual_sharks)


if __name__ == "__main__":
    # `known_data` consists of (all NumPy arrays):
    #   - embeddings
    #   - image_ids
    #   - annotation_ids
    #   - whale_shark_names
    known_data = np.load(OUTPUT_NPZ_FILE)

    # `new_data` consists of (all NumPy arrays):
    #   - embeddings
    #   - bboxes
    #   - image_id_keys
    #   - whaleSharkIDs
    #   - occurrenceIDs
    #   - identificationIDs
    #   - image_url_identifiers
    new_data = np.load(GBIF_OUTPUT_NPZ_FILE)

    print("Loading GBIF clean data for plausibility filtering...")
    gbif_df = read_csv(GBIF_CLEAN_CSV)
    exclusion_map = build_exclusion_map(gbif_df)
    print(f"  {len(exclusion_map)} sharks have at least one IMPOSSIBLE pairing")

    # For each GBIF image, find its closest plausible match within GBIF
    # (new_data) and its closest match within Ningaloo (known_data) separately
    results = identify_sharks(
        known_data=known_data, new_data=new_data, exclusion_map=exclusion_map
    )
    results_df = pd.DataFrame(results)

    gbif_media_df = get_image_records()

    # Add index used for matching explicitly & merge
    gbif_media_df = gbif_media_df.reset_index().rename(columns={"index": "image_id"})

    results_df = translate_npz_positions_to_image_ids(
        results_df, new_data, gbif_media_df
    )

    enriched_df = pd.merge(gbif_media_df, results_df, on="image_id", how="inner")

    export_to_csv(GBIF_PLAUSIBLE_MEDIA_MATCHES_FILE, enriched_df)
    export_to_json(GBIF_PLAUSIBLE_MEDIA_MATCHES_JSON, enriched_df)

    validate_matches(enriched_df)
