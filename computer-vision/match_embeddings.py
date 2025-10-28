###############################################################################
##  `match_embeddings.py`                                                    ##
##                                                                           ##
##  Purpose: Compares new images to known source of truth to identify sharks ##
###############################################################################


import faiss
import numpy as np
import pandas as pd
from typing import Tuple

import json
import unicodedata


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

# JSON files go to website assets folder for React import
JSON_OUTPUT_FOLDER = "./website/src/assets/data/json"
GBIF_MEDIA_MATCHES_JSON = f"{JSON_OUTPUT_FOLDER}/GBIF_media_matches.json"
GBIF_INDIVIDUAL_MATCHES_JSON = f"{JSON_OUTPUT_FOLDER}/GBIF_shark_matches.json"


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



def identify_sharks(known_data: dict, new_data: dict, compare_all: bool = False) -> list[dict]:
    query_miewid = new_data["miewid_embeddings"]
    query_dino = new_data["dinov2_embeddings"]
    query_ids = new_data["identificationIDs"]
    
    results = []
    
    if compare_all:
        # Combine known & new embeddings into single dataset
        all_miewid = np.vstack([known_data["miewid_embeddings"], query_miewid])
        all_dino = np.vstack([known_data["dinov2_embeddings"], query_dino])
        
        # Combine metadata (use identificationID for new data, whale_shark_names for known)
        known_ids = known_data["whale_shark_names"]
        all_ids = np.concatenate([known_ids, query_ids])
        
        # Search against all embeddings (first match will be self, so we need k=2)
        distances_miewid, indices_miewid = perform_search(all_miewid, all_miewid, k=2)
        distances_dino, indices_dino = perform_search(all_dino, all_dino, k=2)
        
        # Process only new data results (skip known data)
        known_count = len(known_data["miewid_embeddings"])
        
        for i in range(len(query_miewid)):
            global_idx = known_count + i
            
            # Use second-best match (first match is always self)
            idx_miewid = indices_miewid[global_idx][1]
            dist_miewid = distances_miewid[global_idx][1]
            
            idx_dino = indices_dino[global_idx][1]
            dist_dino = distances_dino[global_idx][1]
            
            result = {
                "query_index": i,

                # MIEWID match
                "miewid_closest_whale_shark_id": all_ids[idx_miewid],
                "miewid_matched_image_id": idx_miewid,
                "miewid_matched_annotation_id": idx_miewid,
                "miewid_distance": round(float(dist_miewid), 4),

                # DINOv2 match
                "dinov2_closest_whale_shark_id": all_ids[idx_dino],
                "dinov2_matched_image_id": idx_dino,
                "dinov2_matched_annotation_id": idx_dino,
                "dinov2_distance": round(float(dist_dino), 4),
            }
            results.append(result)
    
    else:
        # Compare new data only against known source of truth
        known_miewid = known_data["miewid_embeddings"]
        known_dino = known_data["dinov2_embeddings"]

        distances_miewid, indices_miewid = perform_search(known_miewid, query_miewid)
        distances_dino, indices_dino = perform_search(known_dino, query_dino)

        whale_shark_names = known_data["whale_shark_names"]
        image_ids = known_data["image_ids"]
        annotation_ids = known_data["annotation_ids"]

        # Map back to "source of truth" metadata
        for i in range(len(query_miewid)):
            idx_miewid = indices_miewid[i][0]
            dist_miewid = distances_miewid[i][0]

            idx_dino = indices_dino[i][0]
            dist_dino = distances_dino[i][0]

            result = {
                "query_index": i,

                # MIEWID match
                "miewid_closest_whale_shark_id": whale_shark_names[idx_miewid],
                "miewid_matched_image_id": image_ids[idx_miewid],
                "miewid_matched_annotation_id": annotation_ids[idx_miewid],
                "miewid_distance": round(float(dist_miewid), 4),

                # DINOv2 match
                "dinov2_closest_whale_shark_id": whale_shark_names[idx_dino],
                "dinov2_matched_image_id": image_ids[idx_dino],
                "dinov2_matched_annotation_id": annotation_ids[idx_dino],
                "dinov2_distance": round(float(dist_dino), 4),
            }
            results.append(result)

    return results


def normalize_string(s):
    if not isinstance(s, str):
        return s
    
    # Normalize unicode to decomposed form, then encode to ASCII 
    normalized = unicodedata.normalize('NFKD', s)
    return normalized.encode('ascii', 'ignore').decode('ascii')


def export_to_json(filepath: str, df: pd.DataFrame) -> None:
    # Replace NaN values before converting to DataFrame, then list of dicts
    df_clean = df.fillna('')
    data = df_clean.to_dict('records')
    
    # Normalize string values to handle accents & special characters
    normalized_data = []

    for record in data:
        normalized_record = {}

        for key, value in record.items():
            # Normalize both keys & values
            normalized_key = normalize_string(key)

            if isinstance(value, str):
                normalized_record[normalized_key] = normalize_string(value)
            elif pd.isna(value):
                normalized_record[normalized_key] = None
            else:
                normalized_record[normalized_key] = value
                
        normalized_data.append(normalized_record)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(normalized_data, f, indent=2, default=str, ensure_ascii=True)
    
    print(f"Exported {len(normalized_data)} records to {filepath}")


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

    individual_sharks["identificationID"] = individual_sharks["identificationID"].astype(str)
    media_matches_df["identificationID"] = media_matches_df["identificationID"].astype(str)

    # --- FORMAT & GROUP FOR MIEWID ---
    miewid_fmt = "MIEWID: {0} ({1}, {2})"
    miewid_cols = [
        "miewid_closest_whale_shark_id",
        "miewid_matched_image_id",
        "miewid_distance"
    ]
    miewid_colname = "MIEWID: closest_whale_shark_id (matched_image_id, distance)"

    miewid_df = media_matches_df.groupby("identificationID").apply(
        lambda x: ", ".join(sorted(set(
            miewid_fmt.format(*vals)
            for vals in zip(*(x[col] for col in miewid_cols))
        ))),
        include_groups=False
    ).reset_index(name=miewid_colname)

    # --- FORMAT & GROUP FOR DINOV2 ---
    dino_fmt = "DINOV2: {0} ({1}, {2})"
    dino_cols = [
        "dinov2_closest_whale_shark_id",
        "dinov2_matched_image_id",
        "dinov2_distance"
    ]
    dino_colname = "DINOV2: closest_whale_shark_id (matched_image_id, distance)"

    dino_df = media_matches_df.groupby("identificationID").apply(
        lambda x: ", ".join(sorted(set(
            dino_fmt.format(*vals)
            for vals in zip(*(x[col] for col in dino_cols))
        ))),
        include_groups=False
    ).reset_index(name=dino_colname)

    # --- Merge all formatted columns ---
    individual_sharks = (
        individual_sharks
        .merge(miewid_df, on="identificationID", how="left")
        .merge(dino_df, on="identificationID", how="left")
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
    #   - occurrenceIDs 
    #   - identificationIDs 
    #   - image_url_identifiers 
    new_data = np.load(GBIF_OUTPUT_NPZ_FILE)

    # Compare all embeddings against each other (set to True to find matches within GBIF dataset)
    results = identify_sharks(known_data=known_data, new_data=new_data, compare_all=True)
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
    export_to_json(GBIF_MEDIA_MATCHES_JSON, enriched_df)

    validate_matches(enriched_df)


