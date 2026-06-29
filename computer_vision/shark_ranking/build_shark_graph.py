###############################################################################
##  `build_shark_graph.py`                                                   ##
##                                                                           ##
##  Purpose: Constructs a shark-level graph for the frontend. Each node is   ##
##           a shark (not an image), edges represent best-match              ##
##           relationships, and layout is driven by UMAP on averaged         ##
##           per-shark MiewID embeddings.                                    ##
###############################################################################


import json
from typing import Dict, Set, Tuple

import networkx as nx
import numpy as np
import pandas as pd
import umap
from src.gbif.constants import GBIF_CLEAN_CSV
from src.utils.data_utils import read_csv

from ..vision_utils.plausibility_utils import build_exclusion_map
from ..vision_utils.shark_matching_utils import group_images_by_shark
from .shark_ranking_constants import (
    GBIF_OUTPUT_NPZ_FILE,
    SHARK_GRAPH_DATA_FILE,
    SHARK_RANKING_CSV,
)


def compute_shark_centroids(
    embeddings: np.ndarray, shark_ids: np.ndarray
) -> Tuple[np.ndarray, list[str]]:
    """
    Average all MiewID image embeddings per shark into a single centroid
    vector. Returns (centroid_matrix, ordered_shark_ids).
    """
    shark_to_indices = group_images_by_shark(shark_ids)
    ordered_ids = sorted(shark_to_indices.keys())
    centroids = np.array(
        [embeddings[shark_to_indices[sid]].mean(axis=0) for sid in ordered_ids]
    )
    return centroids, ordered_ids


def build_umap_coords(centroids: np.ndarray) -> np.ndarray:
    """Project shark centroid vectors into 2D via UMAP."""
    print(f"Running UMAP on {len(centroids)} shark centroids...")
    reducer = umap.UMAP(n_components=2, random_state=42)
    return reducer.fit_transform(centroids)


def build_graph(
    ranking_df: pd.DataFrame,
    coords: np.ndarray,
    ordered_ids: list[str],
) -> nx.DiGraph:
    """
    Construct a directed graph: one node per shark, one edge per shark's
    best match. Edges carry aggregate distance stats.
    """
    # Map shark_id -> UMAP coordinates
    coord_map = {
        sid: (float(coords[i][0]), float(coords[i][1]))
        for i, sid in enumerate(ordered_ids)
    }

    G = nx.DiGraph()

    # Add nodes for every shark that has UMAP coordinates
    for sid in ordered_ids:
        x, y = coord_map[sid]
        row = ranking_df[ranking_df["whaleSharkID"] == sid]
        image_count = int(row["image_count"].iloc[0]) if len(row) > 0 else 0
        G.add_node(
            f"shark_{sid}",
            shark_id=sid,
            image_count=image_count,
            x=x,
            y=y,
        )

    # Add edges from each shark to its best match
    for _, row in ranking_df.iterrows():
        source = f"shark_{row['whaleSharkID']}"
        target = f"shark_{row['best_match_shark_id']}"

        if not G.has_node(source) or not G.has_node(target):
            continue

        G.add_edge(
            source,
            target,
            distance_median=float(row["distance_median"]),
            distance_min=float(row["distance_min"]),
            distance_mean=float(row["distance_mean"]),
            distance_max=float(row["distance_max"]),
            pair_count=int(row["pair_count"]),
            mutual=bool(row["is_mutual"]),
        )

    return G


def assign_clusters(G: nx.DiGraph) -> Dict[str, int]:
    """
    Group shark nodes into weakly connected components. Each component
    is a cluster of sharks linked by best-match chains.
    """
    clusters: Dict[str, int] = {}
    for cluster_id, component in enumerate(nx.weakly_connected_components(G)):
        for node in component:
            clusters[node] = cluster_id
    return clusters


def find_contradictions(
    G: nx.DiGraph,
    clusters: Dict[str, int],
    exclusion_map: Dict[str, Set[str]],
) -> Dict[int, list[Tuple[str, str]]]:
    """
    A cluster is contradictory if it contains 2 or more sharks that the
    exclusion map says CANNOT be the same individual. At the shark level,
    this means a transitive chain of best-match edges implies an impossible
    link between two sharks.
    """
    # Collect shark IDs per cluster
    cluster_sharks: Dict[int, Set[str]] = {}
    for node, attrs in G.nodes(data=True):
        cluster_sharks.setdefault(clusters[node], set()).add(attrs["shark_id"])

    contradictions: Dict[int, list[Tuple[str, str]]] = {}

    for cluster_id, shark_ids in cluster_sharks.items():
        for shark_id in shark_ids:
            for other in exclusion_map.get(shark_id, set()) & shark_ids:
                pair = tuple(sorted((shark_id, other)))
                pairs = contradictions.setdefault(cluster_id, [])
                if pair not in pairs:
                    pairs.append(pair)

    return contradictions


def export_graph(
    G: nx.DiGraph,
    clusters: Dict[str, int],
    contradictions: Dict[int, list[Tuple[str, str]]],
) -> None:
    """Write shark-level graph to JSON for the frontend."""
    nodes = []
    for nid, attrs in G.nodes(data=True):
        cluster_id = clusters.get(nid)
        nodes.append(
            {
                "id": nid,
                **attrs,
                "cluster_id": cluster_id,
                "contradiction": cluster_id in contradictions,
            }
        )

    edges = [{"source": u, "target": v, **attrs} for u, v, attrs in G.edges(data=True)]

    contradiction_entries = [
        {
            "cluster_id": cluster_id,
            "conflicting_shark_ids": [list(pair) for pair in pairs],
        }
        for cluster_id, pairs in contradictions.items()
    ]

    graph_data = {
        "nodes": nodes,
        "edges": edges,
        "contradictions": contradiction_entries,
    }

    with open(SHARK_GRAPH_DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(graph_data, f, indent=2)

    print(f"Saved shark graph: {SHARK_GRAPH_DATA_FILE}")
    print(
        f"  {len(nodes)} nodes, {len(edges)} edges,"
        f" {len(contradictions)} clusters with contradictions"
    )


if __name__ == "__main__":
    # Load GBIF embeddings for UMAP projection
    print("Loading GBIF embeddings...")
    gbif_data = np.load(GBIF_OUTPUT_NPZ_FILE)
    embeddings = gbif_data["miewid_embeddings"]
    shark_ids = gbif_data["whaleSharkIDs"].astype(str)

    # Load shark ranking summary (produced by rank_shark_matches.py)
    print("Loading shark rankings...")
    ranking_df = pd.read_csv(SHARK_RANKING_CSV)
    ranking_df["whaleSharkID"] = ranking_df["whaleSharkID"].astype(str)
    ranking_df["best_match_shark_id"] = ranking_df["best_match_shark_id"].astype(str)

    # Compute shark-level centroids & UMAP layout
    centroids, ordered_ids = compute_shark_centroids(embeddings, shark_ids)
    coords = build_umap_coords(centroids)

    # Build the graph, then cluster & detect contradictions
    G = build_graph(ranking_df, coords, ordered_ids)
    clusters = assign_clusters(G)

    print("Loading GBIF clean data for exclusion map...")
    gbif_df = read_csv(GBIF_CLEAN_CSV)
    exclusion_map = build_exclusion_map(gbif_df)

    contradictions = find_contradictions(G, clusters, exclusion_map)

    export_graph(G, clusters, contradictions)
