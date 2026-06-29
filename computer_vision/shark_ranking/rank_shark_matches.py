###############################################################################
##  `rank_shark_matches.py`                                                  ##
##                                                                           ##
##  Purpose: Main orchestrator for the shark-level ranking pipeline.         ##
##           Loads GBIF embeddings, generates candidate pairs, computes      ##
##           aggregate distances, picks the best match per shark, and        ##
##           exports results to CSV + JSON.                                  ##
###############################################################################


from collections import defaultdict
from typing import Dict, Set, Tuple

import numpy as np
import pandas as pd
from src.gbif.constants import GBIF_CLEAN_CSV
from src.utils.data_utils import export_to_csv, read_csv

from ..vision_utils.io_utils import export_to_json
from ..vision_utils.plausibility_utils import build_exclusion_map
from .compare_shark_pairs import PairStats, build_pairwise_detail, compare_all_pairs
from .find_candidates import generate_candidate_pairs
from .shark_ranking_constants import (
    GBIF_OUTPUT_NPZ_FILE,
    SHARK_PAIRWISE_CSV,
    SHARK_PAIRWISE_JSON,
    SHARK_RANKING_CSV,
    SHARK_RANKING_JSON,
)


def rank_matches(
    pair_stats: Dict[Tuple[str, str], PairStats],
    shark_ids: np.ndarray,
) -> Dict[str, PairStats]:
    """
    For each shark, pick candidate pair with the lowest median distance
    as its best match. Returns dict of shark_id -> PairStats for its best.
    """
    # Collect all pair stats that involve each shark, keyed by shark_id
    candidates_by_shark: Dict[str, list[PairStats]] = defaultdict(list)

    for (shark_a, shark_b), stats in pair_stats.items():
        candidates_by_shark[shark_a].append(stats)
        # Flip perspective: B looking at A as a candidate
        flipped = PairStats(
            shark_id_a=shark_b,
            shark_id_b=shark_a,
            image_count_a=stats.image_count_b,
            image_count_b=stats.image_count_a,
            pair_count=stats.pair_count,
            distance_min=stats.distance_min,
            distance_median=stats.distance_median,
            distance_mean=stats.distance_mean,
            distance_max=stats.distance_max,
        )
        candidates_by_shark[shark_b].append(flipped)

    # For each shark, pick candidate with lowest median
    best: Dict[str, PairStats] = {}
    for shark_id, candidates in candidates_by_shark.items():
        best[shark_id] = min(candidates, key=lambda s: s.distance_median)

    # Sharks with no candidates (no images matched anyone plausible)
    all_shark_ids = set(shark_ids.tolist())
    sharks_without_match = all_shark_ids - set(best.keys())
    if sharks_without_match:
        print(f"  {len(sharks_without_match)} sharks had no plausible candidate pairs")

    return best


def detect_mutual_matches(best_matches: Dict[str, PairStats]) -> Set[str]:
    """
    A match is mutual when A's best match is B AND B's best match is A.
    Returns the set of shark IDs that have mutual best matches.
    """
    mutual: Set[str] = set()
    for shark_id, stats in best_matches.items():
        partner = stats.shark_id_b
        if partner in best_matches and best_matches[partner].shark_id_b == shark_id:
            mutual.add(shark_id)
    return mutual


def collect_winning_pairs(best_matches: Dict[str, PairStats]) -> Set[Tuple[str, str]]:
    """
    Collect the set of shark pairs that are someone's best match.
    Sorted tuples to deduplicate (A→B and B→A are the same pair).
    """
    pairs: Set[Tuple[str, str]] = set()
    for stats in best_matches.values():
        pairs.add(tuple(sorted((stats.shark_id_a, stats.shark_id_b))))
    return pairs


def build_ranking_dataframe(
    best_matches: Dict[str, PairStats],
    mutual_sharks: Set[str],
    shark_image_counts: Dict[str, int],
) -> pd.DataFrame:
    """Assemble shark ranking summary as a DataFrame."""
    rows = []
    for shark_id, stats in best_matches.items():
        rows.append(
            {
                "whaleSharkID": shark_id,
                "image_count": shark_image_counts.get(shark_id, 0),
                "best_match_shark_id": stats.shark_id_b,
                "best_match_image_count": shark_image_counts.get(stats.shark_id_b, 0),
                "pair_count": stats.pair_count,
                "distance_min": stats.distance_min,
                "distance_median": stats.distance_median,
                "distance_mean": stats.distance_mean,
                "distance_max": stats.distance_max,
                "is_mutual": shark_id in mutual_sharks,
            }
        )

    df = pd.DataFrame(rows)
    df = df.sort_values(["distance_median", "whaleSharkID"]).reset_index(drop=True)
    return df


if __name__ == "__main__":
    # Load GBIF MiewID embeddings
    print("Loading GBIF embeddings...")
    gbif_data = np.load(GBIF_OUTPUT_NPZ_FILE)
    embeddings = gbif_data["miewid_embeddings"]
    shark_ids = gbif_data["whaleSharkIDs"].astype(str)
    image_urls = gbif_data["image_url_identifiers"]

    print(f"  {len(embeddings)} images across {len(set(shark_ids))} unique sharks")

    # Build plausibility exclusion map
    print("Loading GBIF clean data for plausibility filtering...")
    gbif_df = read_csv(GBIF_CLEAN_CSV)
    exclusion_map = build_exclusion_map(gbif_df)
    print(f"  {len(exclusion_map)} sharks have at least one IMPOSSIBLE pairing")

    # Step 1: Generate candidate shark pairs via FAISS
    candidate_pairs = generate_candidate_pairs(embeddings, shark_ids, exclusion_map)

    # Step 2: Compute pairwise distances for all candidate pairs
    pair_stats = compare_all_pairs(embeddings, shark_ids, candidate_pairs)

    # Step 3: Pick best match per shark (lowest median)
    print("Ranking best match per shark by median distance...")
    best_matches = rank_matches(pair_stats, shark_ids)
    print(f"  {len(best_matches)} sharks have a best match")

    # Step 4: Detect mutual matches
    mutual_sharks = detect_mutual_matches(best_matches)
    print(f"  {len(mutual_sharks)} sharks have mutual best matches")

    # Step 5: Build & export shark ranking summary
    shark_image_counts = {sid: int(np.sum(shark_ids == sid)) for sid in set(shark_ids)}
    ranking_df = build_ranking_dataframe(
        best_matches, mutual_sharks, shark_image_counts
    )

    print(f"\nExporting shark rankings ({len(ranking_df)} sharks)...")
    export_to_csv(SHARK_RANKING_CSV, ranking_df)
    export_to_json(SHARK_RANKING_JSON, ranking_df)

    # Step 6: Build & export image-pair detail for winning pairs
    winning_pairs = collect_winning_pairs(best_matches)
    print(f"Computing image-pair detail for {len(winning_pairs)} winning pairs...")

    pairwise_rows = build_pairwise_detail(
        embeddings, shark_ids, image_urls, winning_pairs
    )
    pairwise_df = pd.DataFrame(pairwise_rows)
    pairwise_df = pairwise_df.sort_values(
        ["shark_id_a", "shark_id_b", "distance"]
    ).reset_index(drop=True)

    print(f"Exporting pairwise distances ({len(pairwise_df)} image pairs)...")
    export_to_csv(SHARK_PAIRWISE_CSV, pairwise_df)
    export_to_json(SHARK_PAIRWISE_JSON, pairwise_df)

    print("\nShark ranking pipeline complete!")
    print(f"  Rankings: {SHARK_RANKING_CSV}")
    print(f"  Pairwise: {SHARK_PAIRWISE_CSV}")
