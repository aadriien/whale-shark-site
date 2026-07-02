# Shark-Level Ranking Pipeline

## Overview

A self-contained pipeline that determines the best **shark-to-shark** match
for every GBIF whale shark, based on aggregate MiewID embedding distances across
all image pairs. Separate from the image-level matching in
`unfiltered_matching/` and `plausible_matching/`.

---

## Directory Structure

```
computer_vision/
  shark_ranking/
    __init__.py
    shark_ranking_constants.py      <-- output paths for this feature
    find_candidates.py              <-- FAISS search -> candidate shark pairs
    compare_shark_pairs.py          <-- pairwise distance matrices + aggregation
    rank_shark_matches.py           <-- main orchestrator: load -> rank -> export
    build_shark_graph.py            <-- UMAP + graph construction + JSON export
```

---

## `shark_ranking_constants.py`

Output path constants scoped to this feature. Re-imports `GBIF_OUTPUT_NPZ_FILE`
from `root_constants.py`.

| Constant | Path | Purpose |
|----------|------|---------|
| `SHARK_RANKING_CSV` | `computer_vision/data/outputs/new_embeddings/shark_ranking/GBIF_shark_rankings.csv` | One row per shark: best match + aggregate stats |
| `SHARK_RANKING_JSON` | `website/src/assets/data/json/matching/ranking/GBIF_shark_rankings.json` | Same, for frontend consumption |
| `SHARK_PAIRWISE_CSV` | `computer_vision/data/outputs/new_embeddings/shark_ranking/GBIF_shark_pairwise_distances.csv` | One row per image-pair within each candidate shark pair |
| `SHARK_PAIRWISE_JSON` | `website/src/assets/data/json/matching/ranking/GBIF_shark_pairwise_distances.json` | Same, for frontend (powers the right panel detail view) |
| `SHARK_GRAPH_DATA_FILE` | `website/src/assets/data/json/matching/ranking/shark_graph_data.json` | Graph JSON for the new shark-level Cytoscape graph |

---

## `find_candidates.py`

Uses FAISS to find image-level neighbors, then extracts candidate shark pairs
worth investigating at the aggregate level.

### Algorithm

```
Step 1: FAISS search (k=500)
  - L2-normalize all MiewID embeddings
  - FAISS IndexFlatL2 search: each image against all images

Step 2: Candidate extraction
  - For each image, scan results to extract top 10 different plausible sharks
    (skip same-shark images, skip excluded sharks per exclusion map)
  - Collect the union of all candidate shark pairs across all images
    A pair (A, B) is a candidate if ANY image of A has B in its top-10
  - Pairs are stored as sorted tuples to avoid (A,B)/(B,A) duplication
```

- **Input**: MiewID embeddings, whaleSharkIDs, exclusion map
- **Output**: `set[tuple[str, str]]` — unordered set of candidate shark pairs
- Shared utils used: `perform_search` (embedding_utils), `find_top_n_different_sharks` (shark_matching_utils)

---

## `compare_shark_pairs.py`

For a set of candidate shark pairs, computes the full N×M pairwise distance
matrix across all their images and produces aggregate stats.

### Algorithm

```
Step 1: Group images by whaleSharkID (shark -> list of embedding indices)

Step 2: For each candidate pair (A, B):
  - Extract A's MiewID embeddings (N vectors) and B's (M vectors)
  - Compute full N×M squared L2 distance matrix (on normalized embeddings)
  - Compute aggregate stats: min, median, mean, max, count (N×M)

Step 3: For winning pairs, record every image-pair distance + URL
  (for the frontend detail export with thumbnails)
```

- Uses squared L2 distance to match FAISS IndexFlatL2 scale
- Shared utils used: `compute_pairwise_distances`, `normalize_l2` (embedding_utils), `group_images_by_shark` (shark_matching_utils)

---

## `rank_shark_matches.py`

Main orchestrator. Loads data, calls `find_candidates` and
`compare_shark_pairs`, picks the best match per shark, detects mutual matches,
and exports results.

### Algorithm

```
Step 1: Load data
  - Load GBIF embeddings from NPZ (MiewID only)
  - Load GBIF clean CSV for plausibility
  - Build exclusion map via plausibility_utils.build_exclusion_map()

Step 2: Generate candidate shark pairs via FAISS
  - generate_candidate_pairs()

Step 3: Compute pairwise distances for all candidate pairs
  - compare_all_pairs()

Step 4: Rank and select best match per shark
  - For each shark, among all its candidate pairs, pick the one with
    the lowest median distance as its "best match"
  - Record whether the match is mutual (A's best is B AND B's best is A)

Step 5: Export
  - Shark ranking summary -> CSV + JSON
  - Image-pair detail for winning pairs -> CSV + JSON
```

### Shark Ranking Summary Schema (one row per shark)

| Column | Description |
|--------|-------------|
| `whaleSharkID` | Query shark |
| `image_count` | Number of images for this shark |
| `best_match_shark_id` | whaleSharkID of the closest matching shark |
| `best_match_image_count` | Number of images for the matched shark |
| `pair_count` | N × M (total image pairs compared) |
| `distance_min` | Minimum pairwise MiewID distance (squared L2) |
| `distance_median` | Median pairwise MiewID distance (squared L2) |
| `distance_mean` | Mean pairwise MiewID distance (squared L2) |
| `distance_max` | Maximum pairwise MiewID distance (squared L2) |
| `is_mutual` | True if the matched shark's best match is this shark |

### Image Pair Detail Schema (one row per image-image pair)

| Column | Description |
|--------|-------------|
| `shark_id_a` | whaleSharkID of shark A |
| `image_url_a` | Image URL for shark A's image |
| `shark_id_b` | whaleSharkID of shark B |
| `image_url_b` | Image URL for shark B's image |
| `distance` | Squared L2 distance (MiewID, normalized) |

Only pairs where (A, B) is A's best match OR B's best match are included
in the detail export (not all candidate pairs — just the ones that "won").

---

## `build_shark_graph.py`

Constructs a shark-level graph for the frontend: one node per shark, edges
representing best-match relationships, with UMAP layout.

### Algorithm

```
Step 1: Load data
  - Load shark ranking summary (CSV from rank_shark_matches output)
  - Load GBIF embeddings from NPZ (for UMAP projection)

Step 2: Compute shark-level embeddings for UMAP
  - For each shark, average all its MiewID image embeddings into one
    centroid vector
  - Run UMAP on the centroid vectors -> 2D coordinates per shark

Step 3: Build graph
  - Nodes: one per shark, with UMAP (x, y), image_count, whaleSharkID
  - Edges: directed, from each shark to its best_match_shark_id
    - Carries: distance_median, distance_min, distance_max, is_mutual
  - Flag mutual edges (A->B exists AND B->A exists)

Step 4: Detect contradictions
  - Weakly connected components of the directed graph
  - At shark level, contradictions mean: a transitive chain of best-match
    edges links two sharks that the exclusion map says are IMPOSSIBLE

Step 5: Export
  - Shark graph JSON -> website/src/assets/data/json/matching/ranking/shark_graph_data.json
```

### Graph JSON Schema

```json
{
  "nodes": [
    {
      "id": "shark_<whaleSharkID>",
      "shark_id": "<whaleSharkID>",
      "image_count": 5,
      "x": 1.234,
      "y": 5.678,
      "cluster_id": 0,
      "contradiction": false
    }
  ],
  "edges": [
    {
      "source": "shark_<A>",
      "target": "shark_<B>",
      "distance_median": 0.62,
      "distance_min": 0.38,
      "distance_max": 1.91,
      "pair_count": 24,
      "mutual": true
    }
  ],
  "contradictions": [
    {
      "cluster_id": 3,
      "conflicting_shark_ids": [["123", "456"]]
    }
  ]
}
```

---

## Key Design Decisions

- **GBIF only.** No Ningaloo comparison. Exclusion map filters impossible pairs.
- **MiewID only.** DINOv2 is not used for ranking.
- **Median for ranking.** Best match = lowest median across all image pairs.
  Min/mean/max are exported for the frontend but don't drive the ranking.
- **k=500 in FAISS.** Brute-force IndexFlatL2 computes all distances anyway;
  k only affects how many results are returned. 500 guarantees we never miss
  a candidate due to same-shark images or exclusions filling up slots.
- **Top 10 candidate sharks per image.** Balances breadth with a manageable
  candidate set. The union across all images for a shark will typically be
  larger (a shark with 5 images might surface 30+ unique candidate sharks).
- **Squared L2 distances.** Consistent with FAISS IndexFlatL2 output scale.

---

## Dependencies

Imports from shared `vision_utils/`:

| Import | Source |
|--------|--------|
| `build_exclusion_map` | `vision_utils/plausibility_utils.py` |
| `perform_search` | `vision_utils/embedding_utils.py` |
| `find_top_n_different_sharks` | `vision_utils/shark_matching_utils.py` |
| `group_images_by_shark` | `vision_utils/shark_matching_utils.py` |
| `compute_pairwise_distances`, `normalize_l2` | `vision_utils/embedding_utils.py` |
| `export_to_json` | `vision_utils/io_utils.py` |

Imports from `root_constants.py`:

| Import | Source |
|--------|--------|
| `GBIF_OUTPUT_NPZ_FILE` | `root_constants.py` (via `shark_ranking_constants.py`) |

External:

| Import | Source |
|--------|--------|
| `GBIF_CLEAN_CSV` | `src/gbif/constants.py` |
| `read_csv`, `export_to_csv` | `src/utils/data_utils.py` |