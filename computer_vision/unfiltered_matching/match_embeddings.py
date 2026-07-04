###############################################################################
##  `match_embeddings.py`                                                    ##
##                                                                           ##
##  Purpose: Compares new images to known source of truth to identify sharks ##
###############################################################################


import numpy as np
import pandas as pd
from src.gbif.constants import (
    GBIF_INDIVIDUAL_SHARKS_STATS_CSV,
)
from src.utils.data_utils import (
    export_to_csv,
    read_csv,
)

from ..root_constants import (
    GBIF_OUTPUT_NPZ_FILE,
    OUTPUT_NPZ_FILE,
)
from ..vision_utils.embedding_utils import perform_search  # noqa: F401
from ..vision_utils.io_utils import (
    export_to_json,
    format_match_summary,
    get_image_records,
    translate_npz_positions_to_image_ids,
)  # noqa: F401
from ..vision_utils.shark_matching_utils import find_first_different_shark  # noqa: F401
from .unfiltered_matching_constants import (
    GBIF_INDIVIDUAL_MATCHES_FILE,
    GBIF_INDIVIDUAL_MATCHES_JSON,
    GBIF_MEDIA_MATCHES_FILE,
    GBIF_MEDIA_MATCHES_JSON,
)


def identify_sharks(known_data: dict, new_data: dict) -> list[dict]:
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
    # enough (k=50) to find the first genuinely different shark.
    gbif_dist_miewid, gbif_idx_miewid = perform_search(query_miewid, query_miewid, k=50)
    gbif_dist_dino, gbif_idx_dino = perform_search(query_dino, query_dino, k=50)

    # Closest match within Ningaloo: search the Ningaloo source-of-truth set.
    # GBIF whaleSharkIDs and Ningaloo whale_shark_names are different ID schemes,
    # so a same-ID collision is unlikely - a shallow scan (k=5) is just a guardrail.
    ningaloo_dist_miewid, ningaloo_idx_miewid = perform_search(
        known_miewid, query_miewid, k=5
    )
    ningaloo_dist_dino, ningaloo_idx_dino = perform_search(known_dino, query_dino, k=5)

    results = []
    for i in range(len(query_miewid)):
        current_shark_id = query_ids[i]

        idx_gbif_miewid, dist_gbif_miewid = find_first_different_shark(
            gbif_idx_miewid[i],
            gbif_dist_miewid[i],
            query_ids,
            current_shark_id,
            exclude_index=i,
        )
        idx_gbif_dino, dist_gbif_dino = find_first_different_shark(
            gbif_idx_dino[i],
            gbif_dist_dino[i],
            query_ids,
            current_shark_id,
            exclude_index=i,
        )
        idx_ningaloo_miewid, dist_ningaloo_miewid = find_first_different_shark(
            ningaloo_idx_miewid[i],
            ningaloo_dist_miewid[i],
            known_names,
            current_shark_id,
        )
        idx_ningaloo_dino, dist_ningaloo_dino = find_first_different_shark(
            ningaloo_idx_dino[i], ningaloo_dist_dino[i], known_names, current_shark_id
        )

        result = {
            "image_id": i,  # renamed from query_index for clarity
            # MIEWID - closest match within GBIF (new_data)
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
            # DINOv2 - closest match within GBIF (new_data)
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


def validate_matches(media_matches_df: pd.DataFrame) -> None:
    media_sharks_df = read_csv(GBIF_INDIVIDUAL_SHARKS_STATS_CSV)

    RELEVANT_COLUMNS = [
        "whaleSharkID",
        # "organismID",
        "identificationID",
        "Oldest Occurrence",
        "Newest Occurrence",
        "country (year)",
        "stateProvince - verbatimLocality (month year)",
        # "imageURL (license, creator)"
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

    export_to_csv(GBIF_INDIVIDUAL_MATCHES_FILE, individual_sharks)
    export_to_json(GBIF_INDIVIDUAL_MATCHES_JSON, individual_sharks)


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

    # For each GBIF image, find its closest match within GBIF (new_data)
    # and its closest match within Ningaloo (known_data) separately
    results = identify_sharks(known_data=known_data, new_data=new_data)
    results_df = pd.DataFrame(results)

    gbif_media_df = get_image_records()
    # print(f"Size of media file: {gbif_media_df.shape[0]}")

    # test_df = gbif_media_df.head(10)
    # enriched_df = test_df.reset_index(drop=True).join(results_df)

    # enriched_df = gbif_media_df.reset_index(drop=True).join(results_df)

    # Add index used for matching explicitly & merge
    gbif_media_df = gbif_media_df.reset_index().rename(columns={"index": "image_id"})

    results_df = translate_npz_positions_to_image_ids(
        results_df, new_data, gbif_media_df
    )

    enriched_df = pd.merge(gbif_media_df, results_df, on="image_id", how="inner")

    export_to_csv(GBIF_MEDIA_MATCHES_FILE, enriched_df)
    export_to_json(GBIF_MEDIA_MATCHES_JSON, enriched_df)

    validate_matches(enriched_df)
