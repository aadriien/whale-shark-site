###############################################################################
##  `render_graph.py`                                                        ##
##                                                                           ##
##  Purpose: Interactive Plotly visualization of the whale shark match graph ##
##           with a distance threshold slider to filter edges                ##
###############################################################################


import sys
import json
import numpy as np
import plotly.graph_objects as go

from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from CONSTANTS import GRAPH_DATA_FILE


N_SLIDER_STEPS = 20

# Node colors by population
NINGALOO_COLOR = "steelblue"
GBIF_COLOR = "coral"

# Edge colors by type (RGBA for transparency)
CROSS_EDGE_COLOR = "rgba(60, 179, 113, 0.4)"   # gbif_to_ningaloo: green
WITHIN_EDGE_COLOR = "rgba(255, 165, 0, 0.4)"   # gbif_to_gbif: orange


def load_graph_data() -> dict:
    with open(GRAPH_DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def build_node_traces(nodes: list) -> list[go.Scatter]:
    ningaloo_x, ningaloo_y, ningaloo_ids = [], [], []
    gbif_x, gbif_y, gbif_ids = [], [], []

    for node in nodes:
        if node["population"] == "ningaloo":
            ningaloo_x.append(node["x"])
            ningaloo_y.append(node["y"])
            ningaloo_ids.append(node["shark_id"])
        else:
            gbif_x.append(node["x"])
            gbif_y.append(node["y"])
            gbif_ids.append(node["shark_id"])

    ningaloo_trace = go.Scatter(
        x=ningaloo_x, y=ningaloo_y,
        mode="markers",
        name="Ningaloo (known)",
        marker=dict(color=NINGALOO_COLOR, size=7, opacity=0.85),
        text=ningaloo_ids,
        hovertemplate="<b>Ningaloo</b><br>ID: %{text}<extra></extra>",
    )
    gbif_trace = go.Scatter(
        x=gbif_x, y=gbif_y,
        mode="markers",
        name="GBIF (new)",
        marker=dict(color=GBIF_COLOR, size=7, opacity=0.85),
        text=gbif_ids,
        hovertemplate="<b>GBIF</b><br>ID: %{text}<extra></extra>",
    )

    return [ningaloo_trace, gbif_trace]


def compute_edge_segments(
    edges: list,
    node_coords: dict,
    max_distance: float,
) -> tuple[list, list, list, list]:
    # Build x/y segment lists for edges below max_distance threshold.
    # Each segment is [x_start, x_end, None] so Plotly draws disconnected lines.
    cross_x, cross_y = [], []   # gbif_to_ningaloo
    within_x, within_y = [], [] # gbif_to_gbif

    for edge in edges:
        if edge["distance"] > max_distance:
            continue

        src = node_coords.get(edge["source"])
        tgt = node_coords.get(edge["target"])
        if src is None or tgt is None:
            continue

        seg_x = [src[0], tgt[0], None]
        seg_y = [src[1], tgt[1], None]

        if edge["edge_type"] == "gbif_to_ningaloo":
            cross_x.extend(seg_x)
            cross_y.extend(seg_y)
        else:
            within_x.extend(seg_x)
            within_y.extend(seg_y)

    return cross_x, cross_y, within_x, within_y


def build_figure(graph_data: dict) -> go.Figure:
    nodes = graph_data["nodes"]
    edges = graph_data["edges"]

    # Build fast node-coord lookup: node_id → (x, y)
    node_coords = {n["id"]: (n["x"], n["y"]) for n in nodes}

    distances = [e["distance"] for e in edges]
    dist_min = float(np.min(distances)) if distances else 0.0
    dist_max = float(np.max(distances)) if distances else 1.0

    thresholds = np.linspace(dist_min, dist_max, N_SLIDER_STEPS)

    # Initial render uses the full range
    cx, cy, wx, wy = compute_edge_segments(edges, node_coords, dist_max)

    cross_trace = go.Scatter(
        x=cx, y=cy,
        mode="lines",
        name="GBIF → Ningaloo",
        line=dict(color=CROSS_EDGE_COLOR, width=1),
        hoverinfo="skip",
    )
    within_trace = go.Scatter(
        x=wx, y=wy,
        mode="lines",
        name="GBIF → GBIF",
        line=dict(color=WITHIN_EDGE_COLOR, width=1),
        hoverinfo="skip",
    )

    node_traces = build_node_traces(nodes)

    # Edge traces are indices 0 and 1; node traces follow
    all_traces = [cross_trace, within_trace] + node_traces

    # Build slider steps — each step re-filters edges via restyle on traces [0, 1]
    steps = []
    for threshold in thresholds:
        cx_t, cy_t, wx_t, wy_t = compute_edge_segments(edges, node_coords, threshold)
        step = dict(
            method="restyle",
            label=f"{threshold:.3f}",
            args=[
                {"x": [cx_t, wx_t], "y": [cy_t, wy_t]},
                [0, 1],
            ],
        )
        steps.append(step)

    slider = dict(
        active=N_SLIDER_STEPS - 1,
        currentvalue=dict(prefix="Max distance: ", font=dict(size=13)),
        pad=dict(t=40),
        steps=steps,
    )

    fig = go.Figure(
        data=all_traces,
        layout=go.Layout(
            title="Whale Shark Match Graph (MiewID Embeddings)",
            xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            hovermode="closest",
            sliders=[slider],
            legend=dict(itemsizing="constant"),
            plot_bgcolor="white",
            margin=dict(l=20, r=20, t=60, b=80),
        ),
    )

    return fig


if __name__ == "__main__":
    graph_data = load_graph_data()
    fig = build_figure(graph_data)
    fig.show()
