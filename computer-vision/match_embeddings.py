###############################################################################
##  `match_embeddings.py`                                                    ##
##                                                                           ##
##  Purpose: Compares new images to known source of truth to identify sharks ##
###############################################################################


import faiss
import numpy as np
import pandas as pd
from typing import Tuple


from src.utils.data_utils import (
    read_csv, export_to_csv,
)

from src.analyze.gbif import (
    GBIF_INDIVIDUAL_SHARKS_STATS_CSV,
)

from .process_annotations import (
    OUTPUT_NPZ_FILE,
)

from .get_new_image_embeddings import (
    NEW_EMBEDDINGS_FOLDER, GBIF_OUTPUT_NPZ_FILE,
    get_image_records,
)


GBIF_MEDIA_MATCHES_FILE = f"{NEW_EMBEDDINGS_FOLDER}/GBIF_media_matches.csv"
GBIF_INDIVIDUAL_MATCHES_FILE = f"{NEW_EMBEDDINGS_FOLDER}/GBIF_shark_matches.csv"


# L2 DISTANCE SCALE (for normalized values, to judge match likelihood): 
#   0.0: Perfect match (identical vectors)
#   0.5 - 1.0: Very similar (vectors close together)
#   2.0: Moderate similarity (vectors somewhat different)
#   4.0: Completely different (vectors far apart)

def perform_search(known_embeddings: np.ndarray, 
                    query_embeddings: np.ndarray, 
                    k: int = 1) -> Tuple[np.ndarray, np.ndarray]:
    # Normalize embeddings to make comparison more meaningful
    def normalize_L2(x: np.ndarray) -> np.ndarray:
        return x / np.linalg.norm(x, axis=1, keepdims=True)

    known_embeddings = normalize_L2(known_embeddings)
    query_embeddings = normalize_L2(query_embeddings)

    # Add all known embeddings to index
    index = faiss.IndexFlatL2(known_embeddings.shape[1])  
    index.add(known_embeddings)  

    # Search for top {k} matches
    distances, indices = index.search(query_embeddings, k)
    return distances, indices



def identify_sharks(known_data: dict, new_data: dict) -> list[dict]:
    known_embeddings = known_data["embeddings"]
    query_embeddings = new_data["embeddings"]
    
    distances, indices = perform_search(known_embeddings, query_embeddings)

    whale_shark_names = known_data["whale_shark_names"]
    image_ids = known_data["image_ids"]
    annotation_ids = known_data["annotation_ids"]

    results = []

    # Map back to "source of truth" metadata
    for i, (dist, idx) in enumerate(zip(distances, indices)):
        matched_idx = idx[0]
        result = {
            "query_index": i,
            "closest_whale_shark_id": whale_shark_names[matched_idx],
            "matched_image_id": image_ids[matched_idx],
            "matched_annotation_id": annotation_ids[matched_idx],
            "distance": round(float(dist[0]), 4)
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
    individual_sharks = media_sharks_df.dropna(subset=RELEVANT_COLUMNS).copy()
    individual_sharks.reset_index(drop=True, inplace=True)


    format_str = "closest_whale_shark_id: {0} (matched_image_id: {1}, distance: {2})"
    column_name = "closest_whale_shark_id (matched_image_id, distance)"
    all_metric_vals = [
        "closest_whale_shark_id",
        "matched_image_id",
        "distance"
    ]

    individual_sharks["identificationID"] = individual_sharks["identificationID"].astype(str)
    media_matches_df["identificationID"] = media_matches_df["identificationID"].astype(str)

    media_matches_df = media_matches_df.groupby("identificationID").apply(
        lambda x: ", ".join(sorted(set(
            format_str.format(*vals) 
            for vals in 
            zip(*(x[col] for col in all_metric_vals))
        ))), 
        include_groups=False
    ).reset_index(name=column_name)

    individual_sharks = individual_sharks.merge(media_matches_df, on="identificationID", how="left")

    export_to_csv(GBIF_INDIVIDUAL_MATCHES_FILE, individual_sharks)



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
    #   - occurrenceIDs 
    #   - identificationIDs 
    #   - image_url_identifiers 
    new_data = np.load(GBIF_OUTPUT_NPZ_FILE)


    results = identify_sharks(known_data=known_data, new_data=new_data)
    results_df = pd.DataFrame(results)

    gbif_media_df = get_image_records()
    # print(f"Size of media file: {gbif_media_df.shape[0]}")

    # test_df = gbif_media_df.head(10)
    # enriched_df = test_df.reset_index(drop=True).join(results_df)

    # enriched_df = gbif_media_df.reset_index(drop=True).join(results_df)


    # Add index used for matching explicitly & merge
    results_df["query_index"] = results_df["query_index"].astype(int)
    gbif_media_df = gbif_media_df.reset_index().rename(columns={"index": "query_index"})

    enriched_df = pd.merge(gbif_media_df, results_df, on="query_index", how="inner")


    export_to_csv(GBIF_MEDIA_MATCHES_FILE, enriched_df)

    validate_matches(enriched_df)


