# 🐋 🦈 Whale Shark Site x Match Graph

## Overview

Graph representation of whale shark image match connections, built from MiewID embedding similarity. Each node is a single image; nodes cluster by individual shark identity. Edges connect each GBIF query image to its nearest-neighbor match, weighted by `miewid_distance`.

Serves as a visual reinforcer of the matching pipeline: making transitive identity chains visible (A matches B, B matches C → A and C may be the same individual), and surfacing cross-database links between GBIF observations and Ningaloo source-of-truth images.


## Data Sources

| Input | Description |
|---|---|
| `embeddings-database/whaleshark_ningaloo_embeddings.npz` | Ningaloo source-of-truth images — MiewID embeddings + Wildbook UUIDs (`whale_shark_names`) |
| `new-embeddings/gbif_media_embeddings.npz` | GBIF query images — MiewID embeddings + `whaleSharkID`s |
| `new-embeddings/GBIF_media_matches.csv` | Edge list: per-image FAISS match results with `miewid_distance` |


## Graph Structure

### Nodes

Two populations, one node per image:
- **GBIF** — clustered by `whaleSharkID`
- **Ningaloo** — clustered by Wildbook UUID (`whale_shark_names`)

Node positions are 2D UMAP coordinates projected from the full MiewID embedding vectors across both populations combined. Proximity in the layout reflects actual embedding similarity, so edge lengths are geometrically meaningful.

### Edges

Directed, GBIF image → closest non-self match from the combined FAISS index.

Two types, distinguished by `miewid_matched_image_id` relative to the Ningaloo population count (the combined-index boundary):
- **GBIF → Ningaloo** — cross-database identity claim; the only link between the two datasets
- **GBIF → GBIF** — within-GBIF population match

Edge weight = `miewid_distance` (L2 on normalized vectors; lower = stronger match). Edges are also flagged as **mutual** (A→B and B→A both exist in the data) or **one-sided**, computable at graph-build time without rerunning the pipeline.


## Scripts

| Script | Purpose |
|---|---|
| `build_graph.py` | UMAP projection + networkx graph construction and export |
| `render_graph.py` | Plotly interactive visualization with distance threshold slider |

```sh
make build_shark_graph
make render_shark_graph
```


## Outputs

Saved to `matches-graph/output/`:
- `umap_coords.npz` — 2D UMAP coordinates for all images across both populations
- `graph_data.json` — Full node and edge data with attributes

