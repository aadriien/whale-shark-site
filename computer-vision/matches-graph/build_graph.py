###############################################################################
##  `build_graph.py`                                                         ##
##                                                                           ##
##  Purpose: UMAP projection + networkx graph construction and export        ##
###############################################################################


import os
import sys
import json
import numpy as np
import pandas as pd
import networkx as nx
import umap

from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from CONSTANTS import (
    OUTPUT_NPZ_FILE, GBIF_OUTPUT_NPZ_FILE, GBIF_MEDIA_MATCHES_FILE,
    GRAPH_OUTPUT_DIR, UMAP_COORDS_FILE, GRAPH_DATA_FILE,
)


def load_data() -> tuple[dict, dict, pd.DataFrame]:
    ningaloo = np.load(OUTPUT_NPZ_FILE, allow_pickle=True)
    gbif = np.load(GBIF_OUTPUT_NPZ_FILE, allow_pickle=True)
    matches_df = pd.read_csv(GBIF_MEDIA_MATCHES_FILE)
    return ningaloo, gbif, matches_df


def build_umap_coords(ningaloo: dict, gbif: dict) -> np.ndarray:
    ningaloo_emb = ningaloo["miewid_embeddings"]
    gbif_emb = gbif["miewid_embeddings"]

    # Stack both populations so UMAP projects into a shared 2D space:
    # proximity in the layout reflects actual embedding similarity across datasets
    combined = np.vstack([ningaloo_emb, gbif_emb]).astype(np.float32)

    print(f"Running UMAP on {len(combined)} embeddings ({combined.shape[1]}-dim)...")
    reducer = umap.UMAP(n_components=2, random_state=42)
    coords = reducer.fit_transform(combined)

    return coords


def build_graph(ningaloo: dict, gbif: dict, matches_df: pd.DataFrame, coords: np.ndarray) -> nx.DiGraph:
    # Ningaloo occupies [0, NINGALOO_COUNT) in the combined FAISS index;
    # GBIF occupies [NINGALOO_COUNT, NINGALOO_COUNT + GBIF_COUNT)
    NINGALOO_COUNT = len(ningaloo["miewid_embeddings"])

    ningaloo_names = ningaloo["whale_shark_names"]
    gbif_ids = gbif["whaleSharkIDs"]

    G = nx.DiGraph()

    for i, shark_id in enumerate(ningaloo_names):
        G.add_node(
            f"ningaloo_{i}",
            population="ningaloo",
            shark_id=str(shark_id),
            x=float(coords[i][0]),
            y=float(coords[i][1]),
        )

    for i, shark_id in enumerate(gbif_ids):
        G.add_node(
            f"gbif_{i}",
            population="gbif",
            shark_id=str(shark_id),
            x=float(coords[NINGALOO_COUNT + i][0]),
            y=float(coords[NINGALOO_COUNT + i][1]),
        )

    for _, row in matches_df.iterrows():
        source = f"gbif_{int(row['image_id'])}"
        matched_idx = int(row["miewid_matched_image_id"])
        distance = float(row["miewid_distance"])

        if matched_idx < NINGALOO_COUNT:
            target = f"ningaloo_{matched_idx}"
            edge_type = "gbif_to_ningaloo"
        else:
            # Subtract NINGALOO_COUNT to convert combined-index → GBIF-local index
            target = f"gbif_{matched_idx - NINGALOO_COUNT}"
            edge_type = "gbif_to_gbif"

        if G.has_node(source) and G.has_node(target):
            G.add_edge(source, target, distance=distance, edge_type=edge_type, mutual=False)

    # Flag mutual edges: A→B is mutual if B→A also exists in the match results
    for u, v in list(G.edges()):
        if G.has_edge(v, u):
            G[u][v]["mutual"] = True
            G[v][u]["mutual"] = True

    return G


def export_outputs(coords: np.ndarray, G: nx.DiGraph) -> None:
    os.makedirs(GRAPH_OUTPUT_DIR, exist_ok=True)

    np.savez(UMAP_COORDS_FILE, coords=coords)
    print(f"Saved UMAP coords: {UMAP_COORDS_FILE}")

    graph_data = {
        "nodes": [{"id": nid, **attrs} for nid, attrs in G.nodes(data=True)],
        "edges": [{"source": u, "target": v, **attrs} for u, v, attrs in G.edges(data=True)],
    }

    with open(GRAPH_DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(graph_data, f, indent=2)

    print(f"Saved graph data: {GRAPH_DATA_FILE}")
    print(f"  {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")



if __name__ == "__main__":
    ningaloo, gbif, matches_df = load_data()

    coords = build_umap_coords(ningaloo, gbif)

    G = build_graph(ningaloo, gbif, matches_df, coords)

    export_outputs(coords, G)

    
