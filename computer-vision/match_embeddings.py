###############################################################################
##  `match_embeddings.py`                                                    ##
##                                                                           ##
##  Purpose: Compares new images to known source of truth to identify sharks ##
###############################################################################


import faiss
import numpy as np
from typing import Tuple


from .process_annotations import (
    OUTPUT_NPZ_FILE,
)

from .get_new_image_embeddings import (
    GBIF_OUTPUT_NPZ_FILE,
)


def perform_search(known_embeddings: np.ndarray, 
                    query_embeddings: np.ndarray, 
                    k: int = 1) -> Tuple[np.ndarray, np.ndarray]:
    # Add all known embeddings to index
    index = faiss.IndexFlatL2(known_embeddings.shape[1])  
    index.add(known_embeddings)  

    # Search for top {k} matches
    distances, indices = index.search(query_embeddings, k)
    return distances, indices



def identify_sharks(known_data: dict, new_data: dict) -> None:
    known_embeddings = known_data["embeddings"]
    query_embeddings = new_data["embeddings"]
    
    distances, indices = perform_search(known_embeddings, query_embeddings)

    whale_shark_names = known_data["whale_shark_names"]
    image_ids = known_data["image_ids"]
    annotation_ids = known_data["annotation_ids"]

    # Map back to "source of truth" metadata
    for i, (dist, idx) in enumerate(zip(distances, indices)):
        matched_idx = idx[0]
        print(f"\nQuery Image {i+1}:")
        print(f"  Closest match Whale Shark Name (known): {whale_shark_names[matched_idx]}")
        print(f"  From Image ID (known): {image_ids[matched_idx]}, Annotation ID (known): {annotation_ids[matched_idx]}")
        print(f"  Distance: {dist[0]:.4f}")



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

    identify_sharks(known_data=known_data, new_data=new_data)


