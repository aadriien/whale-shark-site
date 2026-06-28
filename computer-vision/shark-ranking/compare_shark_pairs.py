###############################################################################
##  `compare_shark_pairs.py`                                                 ##
##                                                                           ##
##  Purpose: For a set of candidate shark pairs, computes the full N×M       ##
##           pairwise MiewID distance matrix across all their images and     ##
##           produces aggregate stats (min, median, mean, max).              ##
###############################################################################


from typing import Dict, List, NamedTuple, Set, Tuple

import numpy as np


class PairStats(NamedTuple):
    """Aggregate distance statistics for one shark pair."""
    shark_id_a: str
    shark_id_b: str
    image_count_a: int
    image_count_b: int
    pair_count: int
    distance_min: float
    distance_median: float
    distance_mean: float
    distance_max: float


def group_images_by_shark(shark_ids: np.ndarray) -> Dict[str, List[int]]:
    """Map each whaleSharkID to list of NPZ indices for its images."""
    groups: Dict[str, List[int]] = {}
    for idx, shark_id in enumerate(shark_ids):
        groups.setdefault(shark_id, []).append(idx)
    return groups


def compute_pairwise_distances(
    embeddings_a: np.ndarray, embeddings_b: np.ndarray
) -> np.ndarray:
    """
    Compute full NxM squared L2 distance matrix between 2 sets of
    embeddings. Uses squared L2 to match FAISS IndexFlatL2, which returns
    squared distances. Expects L2-normalized vectors.
    """
    # diff[i, j] = embeddings_a[i] - embeddings_b[j]
    diff = embeddings_a[:, None, :] - embeddings_b[None, :, :]
    return np.sum(diff ** 2, axis=2)


def aggregate_pair_stats(
    shark_id_a: str,
    shark_id_b: str,
    distance_matrix: np.ndarray,
) -> PairStats:
    """Compute min/median/mean/max from a pairwise distance matrix."""
    flat = distance_matrix.ravel()
    return PairStats(
        shark_id_a=shark_id_a,
        shark_id_b=shark_id_b,
        image_count_a=distance_matrix.shape[0],
        image_count_b=distance_matrix.shape[1],
        pair_count=len(flat),
        distance_min=round(float(np.min(flat)), 4),
        distance_median=round(float(np.median(flat)), 4),
        distance_mean=round(float(np.mean(flat)), 4),
        distance_max=round(float(np.max(flat)), 4),
    )


def compare_all_pairs(
    embeddings: np.ndarray,
    shark_ids: np.ndarray,
    candidate_pairs: Set[Tuple[str, str]],
) -> Dict[Tuple[str, str], PairStats]:
    """
    For each candidate shark pair, compute full pairwise distance matrix
    and aggregate stats. Returns a dict keyed by (shark_id_a, shark_id_b).
    """
    # L2-normalize once upfront (consistent with FAISS search normalization)
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    normalized = embeddings / norms

    shark_to_indices = group_images_by_shark(shark_ids)

    print(f"Computing pairwise distances for {len(candidate_pairs)} shark pairs...")
    results: Dict[Tuple[str, str], PairStats] = {}

    for pair in candidate_pairs:
        shark_a, shark_b = pair
        indices_a = shark_to_indices.get(shark_a, [])
        indices_b = shark_to_indices.get(shark_b, [])

        if not indices_a or not indices_b:
            continue

        emb_a = normalized[indices_a]
        emb_b = normalized[indices_b]
        dist_matrix = compute_pairwise_distances(emb_a, emb_b)

        results[pair] = aggregate_pair_stats(shark_a, shark_b, dist_matrix)

    print(f"  Computed stats for {len(results)} pairs")
    return results


def build_pairwise_detail(
    embeddings: np.ndarray,
    shark_ids: np.ndarray,
    image_urls: np.ndarray,
    winning_pairs: Set[Tuple[str, str]],
) -> list[dict]:
    """
    For each winning shark pair, build per-image-pair detail rows with
    individual distances and image URLs (for frontend thumbnails).
    """
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    normalized = embeddings / norms

    shark_to_indices = group_images_by_shark(shark_ids)
    rows: list[dict] = []

    for shark_a, shark_b in winning_pairs:
        indices_a = shark_to_indices.get(shark_a, [])
        indices_b = shark_to_indices.get(shark_b, [])

        if not indices_a or not indices_b:
            continue

        emb_a = normalized[indices_a]
        emb_b = normalized[indices_b]
        dist_matrix = compute_pairwise_distances(emb_a, emb_b)

        for i, idx_a in enumerate(indices_a):
            for j, idx_b in enumerate(indices_b):
                rows.append({
                    "shark_id_a": shark_a,
                    "image_url_a": str(image_urls[idx_a]),
                    "shark_id_b": shark_b,
                    "image_url_b": str(image_urls[idx_b]),
                    "distance": round(float(dist_matrix[i, j]), 4),
                })

    return rows