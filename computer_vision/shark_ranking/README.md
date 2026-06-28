# Shark-Level Ranking Pipeline — Implementation Plan

## Overview

A new, self-contained pipeline that determines the best **shark-to-shark** match
for every GBIF whale shark, based on aggregate MiewID embedding distances across
all image pairs. Completely separate from the existing image-level matching in
`match_embeddings.py` / `match_plausible_embeddings.py` — no existing files or
outputs are modified.

---

## Directory Structure

```
computer-vision/
  shark-ranking/                    <-- new subdirectory
    __init__.py
    constants.py                    <-- output paths for this feature only
    find_candidates.py              <-- FAISS search → candidate shark pairs
    compare_shark_pairs.py          <-- pairwise distance matrices + aggregation
    rank_shark_matches.py           <-- main orchestrator: load → rank → export
    build_shark_graph.py            <-- UMAP + graph construction + JSON export
```

---

## File 1: `constants.py`

Output path constants scoped to this feature. Mirrors the pattern in
`computer-vision/CONSTANTS.py` but only defines new paths.

### Paths

| Constant | Path | Purpose |
|----------|------|---------|
| `SHARK_RANKING_CSV` | `computer-vision/new-embeddings/GBIF_shark_rankings.csv` | One row per shark: best match + aggregate stats |
| `SHARK_RANKING_JSON` | `website/src/assets/data/json/GBIF_shark_rankings.json` | Same, for frontend consumption |
| `SHARK_PAIRWISE_CSV` | `computer-vision/new-embeddings/GBIF_shark_pairwise_distances.csv` | One row per image-pair within each candidate shark pair |
| `SHARK_PAIRWISE_JSON` | `website/src/assets/data/json/GBIF_shark_pairwise_distances.json` | Same, for frontend (powers the right panel detail view) |
| `SHARK_GRAPH_DATA_FILE` | `website/src/assets/data/json/shark_graph_data.json` | Graph JSON for the new shark-level Cytoscape graph |

Also re-imports shared input paths from parent `CONSTANTS.py`:
- `GBIF_OUTPUT_NPZ_FILE` (GBIF embeddings)

---

## File 2: `find_candidates.py`

### Purpose

Use FAISS to find image-level neighbors, then extract candidate shark pairs
worth investigating at the aggregate level.

### Functions

```
find_candidates.py
├── normalize_embeddings()           — L2-normalize embedding vectors
├── find_top_n_different_sharks()    — scan one image's FAISS results for N
│                                      different plausible sharks (skips same-
│                                      shark images and excluded sharks)
└── generate_candidate_pairs()       — runs FAISS search (k=500), calls
                                       find_top_n_different_sharks for each
                                       image (top 10), returns the union of
                                       all candidate shark pairs
```

### Details

- **Input**: MiewID embeddings, whaleSharkIDs, exclusion map
- **Output**: `set[tuple[str, str]]` — unordered set of candidate shark pairs
- FAISS `IndexFlatL2`, k=500
- For each image, scan FAISS results to find top 10 different plausible sharks
  (skip same-shark images, skip excluded sharks per exclusion map)
- A pair (A, B) is a candidate if ANY image of A has B in its top-10
- Pairs are stored as sorted tuples to avoid (A,B)/(B,A) duplication

---

## File 3: `compare_shark_pairs.py`

### Purpose

For a set of candidate shark pairs, compute the full N×M pairwise distance
matrix across all their images and produce aggregate stats.

### Functions

```
compare_shark_pairs.py
├── group_images_by_shark()          — whaleSharkID → list of NPZ indices
├── compute_pairwise_distances()     — full N×M L2 distance matrix for one
│                                      shark pair (on normalized embeddings)
├── aggregate_pair_stats()           — min/median/mean/max/count from a
│                                      distance matrix
└── compare_all_pairs()              — iterates candidate pairs, calls the
                                       above, returns dict of pair → stats
                                       and list of per-image-pair rows
```

### Details

- **Input**: normalized embeddings, whaleSharkIDs, set of candidate pairs
- **Output**:
  - `dict[(str, str), PairStats]` — aggregate stats per candidate pair
  - `list[dict]` — per-image-pair detail rows (all pairs, not just winners;
    filtering to winners happens in the orchestrator)
- Distance matrix: `np.linalg.norm(A[:, None] - B[None, :], axis=2)`
  (equivalent to pairwise L2 on already-normalized vectors)

---

## File 4: `rank_shark_matches.py`

### Purpose

Main orchestrator. Loads data, calls `find_candidates` and
`compare_shark_pairs`, picks the best match per shark, detects mutual matches,
and exports results.

### Functions

```
rank_shark_matches.py
├── rank_matches()                   — for each shark, among all its candidate
│                                      pairs, pick the one with the lowest
│                                      median distance as its best match
├── detect_mutual_matches()          — flag pairs where A's best is B AND
│                                      B's best is A
├── filter_pairwise_to_winners()     — trim image-pair detail rows to only
│                                      include pairs where (A, B) is A's best
│                                      match or B's best match
└── __main__                         — orchestrates:
                                       1. load NPZ + GBIF clean CSV
                                       2. build exclusion map
                                       3. generate_candidate_pairs()
                                       4. compare_all_pairs()
                                       5. rank_matches()
                                       6. detect_mutual_matches()
                                       7. filter_pairwise_to_winners()
                                       8. export CSV + JSON
```

### Shark Ranking Summary Schema (one row per shark)

| Column | Description |
|--------|-------------|
| `whaleSharkID` | Query shark |
| `image_count` | Number of images for this shark |
| `best_match_shark_id` | whaleSharkID of the closest matching shark |
| `best_match_image_count` | Number of images for the matched shark |
| `pair_count` | N × M (total image pairs compared) |
| `distance_min` | Minimum pairwise MiewID distance |
| `distance_median` | Median pairwise MiewID distance |
| `distance_mean` | Mean pairwise MiewID distance |
| `distance_max` | Maximum pairwise MiewID distance |
| `is_mutual` | True if the matched shark's best match is this shark |

### Image Pair Detail Schema (one row per image-image pair)

| Column | Description |
|--------|-------------|
| `shark_id_a` | whaleSharkID of shark A |
| `image_index_a` | NPZ position of image A |
| `shark_id_b` | whaleSharkID of shark B |
| `image_index_b` | NPZ position of image B |
| `distance` | L2 distance (MiewID, normalized) |

Only pairs where (A, B) is A's best match OR B's best match are included
in the detail export (not all candidate pairs — just the ones that "won").

---

## File 5: `build_shark_graph.py`

### Purpose

Construct a shark-level graph for the frontend: one node per shark, edges
representing best-match relationships, with UMAP layout.

### Algorithm

```
Step 1: Load data
  - Load shark ranking summary (CSV or from rank_shark_matches output)
  - Load GBIF embeddings from NPZ (for UMAP projection)

Step 2: Compute shark-level embeddings for UMAP
  - For each shark, average all its MiewID image embeddings into one
    centroid vector
  - Run UMAP on the centroid vectors → 2D coordinates per shark

Step 3: Build graph
  - Nodes: one per shark, with UMAP (x, y), image_count, whaleSharkID
  - Edges: directed, from each shark to its best_match_shark_id
    - Carries: distance_median, distance_min, distance_max, is_mutual
  - Flag mutual edges (A→B exists AND B→A exists)

Step 4: Detect contradictions
  - Reuse cluster + contradiction logic from existing build_graph.py
    (weakly connected components, exclusion map check)
  - At shark level, contradictions mean: a transitive chain of best-match
    edges links two sharks that the exclusion map says are IMPOSSIBLE

Step 5: Export
  - Shark graph JSON → website/src/assets/data/json/shark_graph_data.json
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

### Functions

```
build_shark_graph.py
├── compute_shark_centroids()     — average image embeddings per shark
├── build_umap_coords()           — UMAP on centroid vectors
├── build_graph()                  — nodes + edges from ranking summary
├── assign_clusters()              — weakly connected components
├── find_contradictions()          — exclusion map check on clusters
└── export_graph()                 — write shark_graph_data.json
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
- **Normalization.** L2-normalize embeddings before FAISS search AND before
  pairwise distance computation, consistent with `match_embeddings.perform_search`.

---

## Dependencies

Imports from existing codebase (read-only, no modifications):

| Import | Source |
|--------|--------|
| `build_exclusion_map` | `computer-vision/assess_shark_match_plausibility.py` |
| `perform_search` | `computer-vision/match_embeddings.py` |
| `export_to_json` | `computer-vision/match_embeddings.py` |
| `GBIF_OUTPUT_NPZ_FILE` | `computer-vision/CONSTANTS.py` |
| `GBIF_CLEAN_CSV` | `src/gbif/constants.py` |
| `read_csv`, `export_to_csv` | `src/utils/data_utils.py` |

---

## What This Does NOT Touch

- `match_embeddings.py` — unchanged
- `match_plausible_embeddings.py` — unchanged
- `build_graph.py` — unchanged
- `graph_data.json` — unchanged (the image-level graph)
- Any existing CSV/JSON outputs
- Any frontend code (separate effort)
