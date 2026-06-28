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

from ..match_embeddings import perform_search

# FAISS k=500: brute-force IndexFlatL2 computes all distances regardless of k,
# so this is generous headroom to guarantee we find enough different plausible
# sharks per image (same-shark images & excluded sharks consume slots first)
FAISS_K = 500

# Per image, extract this many different plausible sharks from FAISS results
CANDIDATES_PER_IMAGE = 10


def find_top_n_different_sharks(
    indices: np.ndarray,
    distances: np.ndarray,
    candidate_ids: np.ndarray,
    current_shark_id: str,
    excluded_ids: Set[str],
    exclude_index: int,
    n: int = CANDIDATES_PER_IMAGE,
) -> list[Tuple[str, float]]:
    """
    Scan one image's FAISS results for the top N different plausible sharks.
    Skips same-shark images and geographically/temporally impossible matches.

    Returns list of (shark_id, distance) tuples, up to `n` entries.
    """
    found: list[Tuple[str, float]] = []
    seen_sharks: Set[str] = set()

    for rank, candidate_idx in enumerate(indices):
        if candidate_idx == exclude_index:
            continue

        shark_id = candidate_ids[candidate_idx]

        # Skip same shark & already-found sharks
        if shark_id == current_shark_id or shark_id in seen_sharks:
            continue

        # Skip geographically/temporally impossible matches
        if shark_id in excluded_ids:
            continue

        found.append((shark_id, float(distances[rank])))
        seen_sharks.add(shark_id)

        if len(found) >= n:
            break

    return found


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