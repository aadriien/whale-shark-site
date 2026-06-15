###############################################################################
##  `build_graph.py`                                                         ##
##                                                                           ##
##  Purpose: UMAP projection + networkx graph construction & export          ##
###############################################################################


import json

import networkx as nx
import numpy as np
import pandas as pd
import umap
from src.gbif.constants import GBIF_CLEAN_CSV
from src.utils.data_utils import read_csv

from .assess_shark_match_plausibility import build_exclusion_map
from .CONSTANTS import (
    GBIF_OUTPUT_NPZ_FILE,
    GBIF_PLAUSIBLE_MEDIA_MATCHES_FILE,
    GRAPH_DATA_FILE,
    OUTPUT_NPZ_FILE,
)


def load_data() -> tuple[dict, dict, pd.DataFrame]:
    ningaloo = np.load(OUTPUT_NPZ_FILE, allow_pickle=True)
    gbif = np.load(GBIF_OUTPUT_NPZ_FILE, allow_pickle=True)
    matches_df = pd.read_csv(GBIF_PLAUSIBLE_MEDIA_MATCHES_FILE)
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


def build_graph(
    ningaloo: dict, gbif: dict, matches_df: pd.DataFrame, coords: np.ndarray
) -> nx.DiGraph:
    # Ningaloo occupies [0, NINGALOO_COUNT) in the combined FAISS index;
    # GBIF occupies [NINGALOO_COUNT, NINGALOO_COUNT + GBIF_COUNT)
    NINGALOO_COUNT = len(ningaloo["miewid_embeddings"])

    ningaloo_names = ningaloo["whale_shark_names"]
    ningaloo_image_ids = ningaloo["image_ids"]
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

    url_to_image_id = dict(
        zip(matches_df["identifier"], matches_df["image_id"].astype(int))
    )

    for i, shark_id in enumerate(gbif_ids):
        url = str(gbif["image_url_identifiers"][i])
        image_id = url_to_image_id.get(url)
        if image_id is None:
            continue
        G.add_node(
            f"gbif_{image_id}",
            population="gbif",
            shark_id=str(shark_id),
            image_id=image_id,
            x=float(coords[NINGALOO_COUNT + i][0]),
            y=float(coords[NINGALOO_COUNT + i][1]),
        )

    # Each GBIF image carries two parallel match families: its closest
    # *other* GBIF shark (gbif_to_gbif) & its closest Ningaloo source-of-truth
    # shark (gbif_to_ningaloo). This means up to 2 outgoing edges per GBIF node.
    # Look up Ningaloo targets by image_id (unique per image; a shark's name
    # is shared across all of its images, so it can't identify a single node).
    ningaloo_image_id_to_idx = {
        int(image_id): i for i, image_id in enumerate(ningaloo_image_ids)
    }

    for _, row in matches_df.iterrows():
        source = f"gbif_{int(row['image_id'])}"
        if not G.has_node(source):
            continue

        gbif_match_idx = int(row["miewid_gbif_matched_image_id"])
        if gbif_match_idx >= 0:
            target = f"gbif_{gbif_match_idx}"
            if G.has_node(target):
                G.add_edge(
                    source,
                    target,
                    distance=float(row["miewid_gbif_distance"]),
                    edge_type="gbif_to_gbif",
                    mutual=False,
                )

        ningaloo_idx = ningaloo_image_id_to_idx.get(
            int(row["miewid_ningaloo_matched_image_id"])
        )
        if ningaloo_idx is not None:
            target = f"ningaloo_{ningaloo_idx}"
            if G.has_node(target):
                G.add_edge(
                    source,
                    target,
                    distance=float(row["miewid_ningaloo_distance"]),
                    edge_type="gbif_to_ningaloo",
                    mutual=False,
                )

    # Flag mutual edges: A→B is mutual if B→A also exists in the match results
    for u, v in list(G.edges()):
        if G.has_edge(v, u):
            G[u][v]["mutual"] = True
            G[v][u]["mutual"] = True

    return G


def assign_clusters(G: nx.DiGraph, mutual_only: bool) -> dict[str, int]:
    # Group GBIF nodes into weakly connected components of gbif_to_gbif
    # matches (transitive chains, e.g. A->B->C become one cluster).
    # gbif_to_ningaloo edges are always excluded: unfiltered (k=1, different
    # ID namespace) Ningaloo hub matches would collapse the graph into one
    # mega-cluster.
    
    # mutual_only restricts to reciprocal top-1 matches (A's top-1 is B AND
    # B's top-1 is A). Since each node has exactly one outgoing gbif_to_gbif
    # edge, mutual components are always singletons or pairs, never longer
    # chains, so contradictions (see find_contradictions) are impossible by
    # construction in this mode, not an empirical finding.
    gbif_only = nx.DiGraph()
    gbif_only.add_nodes_from(
        n for n, attrs in G.nodes(data=True) if attrs.get("population") == "gbif"
    )
    gbif_only.add_edges_from(
        (u, v)
        for u, v, attrs in G.edges(data=True)
        if attrs.get("edge_type") == "gbif_to_gbif"
        and (not mutual_only or attrs.get("mutual"))
    )

    clusters: dict[str, int] = {}
    for cluster_id, component in enumerate(nx.weakly_connected_components(gbif_only)):
        for node in component:
            clusters[node] = cluster_id
    return clusters


def find_contradictions(
    G: nx.DiGraph, clusters: dict[str, int], exclusion_map: dict[str, set[str]]
) -> dict[int, list[tuple[str, str]]]:
    """
    A cluster is contradictory if it contains >=2 GBIF whaleSharkIDs that the
    exclusion map says CANNOT be the same shark (geo/temporally IMPOSSIBLE).
    Direct matches already skip excluded pairs, so any contradiction here
    comes from a longer chain (A~B~C) implying an impossible link (A~C).
    """
    cluster_shark_ids: dict[int, set[str]] = {}
    for node, attrs in G.nodes(data=True):
        if attrs.get("population") != "gbif":
            continue
        cluster_shark_ids.setdefault(clusters[node], set()).add(attrs["shark_id"])

    contradictions: dict[int, list[tuple[str, str]]] = {}

    for cluster_id, shark_ids in cluster_shark_ids.items():
        for shark_id in shark_ids:
            for other in exclusion_map.get(shark_id, set()) & shark_ids:
                pair = tuple(sorted((shark_id, other)))
                pairs = contradictions.setdefault(cluster_id, [])

                if pair not in pairs:
                    pairs.append(pair)

    return contradictions


def contradiction_entries(
    contradictions: dict[int, list[tuple[str, str]]]
) -> list[dict]:
    return [
        {
            "cluster_id": cluster_id,
            "conflicting_shark_ids": [list(pair) for pair in pairs],
        }
        for cluster_id, pairs in contradictions.items()
    ]


def export_graph(
    G: nx.DiGraph,
    clusters_mutual: dict[str, int],
    clusters_all: dict[str, int],
    contradictions_mutual: dict[int, list[tuple[str, str]]],
    contradictions_all: dict[int, list[tuple[str, str]]],
) -> None:
    connected = {n for edge in G.edges() for n in edge}

    nodes = []
    for nid, attrs in G.nodes(data=True):
        if attrs.get("population") == "ningaloo" and nid not in connected:
            continue
        # Ningaloo nodes aren't part of gbif_to_gbif clustering (side context,
        # not under analysis), so they have no cluster_id
        cluster_id_mutual = clusters_mutual.get(nid)
        cluster_id_all = clusters_all.get(nid)
        nodes.append(
            {
                "id": nid,
                **attrs,
                "cluster_id_mutual": cluster_id_mutual,
                "cluster_id_all": cluster_id_all,
                "contradiction_mutual": cluster_id_mutual in contradictions_mutual,
                "contradiction_all": cluster_id_all in contradictions_all,
            }
        )

    graph_data = {
        "nodes": nodes,
        "edges": [
            {"source": u, "target": v, **attrs} for u, v, attrs in G.edges(data=True)
        ],
        "contradictions_mutual": contradiction_entries(contradictions_mutual),
        "contradictions_all": contradiction_entries(contradictions_all),
    }

    with open(GRAPH_DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(graph_data, f, indent=2)

    exported_nodes = len(nodes)
    skipped = G.number_of_nodes() - exported_nodes
    print(f"Saved graph data: {GRAPH_DATA_FILE}")
    print(
        f"  {exported_nodes} nodes ({skipped} isolated ningaloo nodes skipped),"
        f" {G.number_of_edges()} edges"
    )
    print(
        f"  mutual only: {len(set(clusters_mutual.values()))} clusters,"
        f" {len(contradictions_mutual)} with contradictions"
        " (guaranteed: max cluster size 2)"
    )
    print(
        f"  all matches: {len(set(clusters_all.values()))} clusters,"
        f" {len(contradictions_all)} with contradictions"
    )


if __name__ == "__main__":
    ningaloo, gbif, matches_df = load_data()

    coords = build_umap_coords(ningaloo, gbif)

    G = build_graph(ningaloo, gbif, matches_df, coords)

    print("Loading GBIF clean data for exclusion map...")
    gbif_clean_df = read_csv(GBIF_CLEAN_CSV)
    exclusion_map = build_exclusion_map(gbif_clean_df)

    clusters_mutual = assign_clusters(G, mutual_only=True)
    clusters_all = assign_clusters(G, mutual_only=False)
    contradictions_mutual = find_contradictions(G, clusters_mutual, exclusion_map)
    contradictions_all = find_contradictions(G, clusters_all, exclusion_map)

    export_graph(
        G, clusters_mutual, clusters_all, contradictions_mutual, contradictions_all
    )
