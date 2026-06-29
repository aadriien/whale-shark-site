###############################################################################
##  `find_candidates.py`                                                     ##
##                                                                           ##
##  Purpose: Uses FAISS to find image-level neighbors, then extracts         ##
##           candidate shark pairs worth investigating at the aggregate       ##
##           level. Each image's top-N different plausible sharks are         ##
##           collected into a union of candidate pairs.                       ##
###############################################################################


from typing import Dict, Set, Tuple

import numpy as np

from ..vision_utils.embedding_utils import perform_search
from ..vision_utils.shark_matching_utils import find_top_n_different_sharks

# FAISS k=500: brute-force IndexFlatL2 computes all distances regardless of k,
# so this is generous headroom to guarantee we find enough different plausible
# sharks per image (same-shark images & excluded sharks consume slots first)
FAISS_K = 500

# Per image, extract this many different plausible sharks from FAISS results
CANDIDATES_PER_IMAGE = 10


def generate_candidate_pairs(
    embeddings: np.ndarray,
    shark_ids: np.ndarray,
    exclusion_map: Dict[str, Set[str]],
) -> Set[Tuple[str, str]]:
    """
    Run FAISS search across all GBIF images, collecting candidate shark pairs.

    For each image, finds the top CANDIDATES_PER_IMAGE different plausible
    sharks. A pair (A, B) enters the candidate set if ANY image of A has B
    in its top-N. Pairs are stored as sorted tuples to avoid duplication.
    """
    print(f"Running FAISS search (k={FAISS_K}) across {len(embeddings)} images...")
    distances, indices = perform_search(embeddings, embeddings, k=FAISS_K)

    print(f"Extracting top {CANDIDATES_PER_IMAGE} candidate sharks per image...")
    candidate_pairs: Set[Tuple[str, str]] = set()

    for i in range(len(embeddings)):
        current_shark_id = shark_ids[i]
        excluded_ids = exclusion_map.get(current_shark_id, set())

        top_sharks = find_top_n_different_sharks(
            indices[i],
            distances[i],
            shark_ids,
            current_shark_id,
            excluded_ids,
            exclude_index=i,
        )

        for matched_shark_id, _ in top_sharks:
            # Sorted tuple prevents (A,B) / (B,A) duplication
            pair = tuple(sorted((current_shark_id, matched_shark_id)))
            candidate_pairs.add(pair)

    unique_sharks = {s for pair in candidate_pairs for s in pair}
    print(
        f"  {len(candidate_pairs)} candidate pairs"
        f" across {len(unique_sharks)} unique sharks"
    )

    return candidate_pairs
