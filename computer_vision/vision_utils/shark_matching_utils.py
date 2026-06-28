###############################################################################
##  `shark_matching_utils.py`                                                ##
##                                                                           ##
##  Purpose: Shared utilities for scanning FAISS results to find matching    ##
##           sharks, and for grouping images by shark ID.                    ##
###############################################################################


from typing import Dict, List, Set, Tuple

import numpy as np


def find_first_different_shark(
    indices: np.ndarray,
    distances: np.ndarray,
    candidate_ids: np.ndarray,
    current_shark_id: str,
    excluded_ids: Set[str] = frozenset(),
    exclude_index: int | None = None,
) -> Tuple[int | None, float | None]:
    """
    Scan ranked candidates for the first one that belongs to a different
    shark AND is not geographically/temporally IMPOSSIBLE for this shark.
    (skip the query's own image when searching a dataset against itself)
    """
    for rank, candidate_idx in enumerate(indices):
        if exclude_index is not None and candidate_idx == exclude_index:
            continue
        candidate_id = candidate_ids[candidate_idx]
        if candidate_id == current_shark_id:
            continue
        if candidate_id in excluded_ids:
            continue
        return int(candidate_idx), float(distances[rank])

    return None, None


def find_top_n_different_sharks(
    indices: np.ndarray,
    distances: np.ndarray,
    candidate_ids: np.ndarray,
    current_shark_id: str,
    excluded_ids: Set[str],
    exclude_index: int,
    n: int = 10,
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


def group_images_by_shark(shark_ids: np.ndarray) -> Dict[str, List[int]]:
    """Map each whaleSharkID to the list of NPZ indices for its images."""
    groups: Dict[str, List[int]] = {}
    for idx, shark_id in enumerate(shark_ids):
        groups.setdefault(shark_id, []).append(idx)
    return groups