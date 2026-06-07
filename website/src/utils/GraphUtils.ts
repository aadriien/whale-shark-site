import type {
    Core,
    Css,
    ElementDefinition,
    EdgeSingular,
    EventObject,
    NodeSingular,
    StylesheetStyle,
} from "cytoscape";

import type {
    GraphNode,
    GraphEdge,
    EdgeFilterState,
    GraphViewParams,
    SelectedMatch,
} from "../types/graphs";

const POSITION_SCALE = 5000;
const EDGE_OPACITY_MIN = 0.15;

const DIM_OPACITY = 0.08;

const HIGHLIGHT_BORDER = {
    "border-width": 3,
    "border-color": "#ffd700",
    "border-opacity": 1,
} as const;

const SAME_SHARK_BORDER = {
    "border-width": 2,
    "border-color": "#e2e8f0",
    "border-opacity": 1,
} as const;

const NINGALOO_COLOR = "#525252";

const GBIF_TO_NINGALOO_COLOR = "#3cb371";
const GBIF_TO_GBIF_COLOR = "#e8a020";

export const CONTINENT_COLORS: Record<string, string> = {
    "North America": "#F59E0B",
    Asia: "#06B6D4",
    Oceania: "#8B5CF6",
    Africa: "#10B981",
    "South America": "#F43F5E",
    Europe: "#6366F1",
    Unknown: "#9CA3AF",
};

export const GRAPH_STYLESHEET: StylesheetStyle[] = [
    {
        selector: "node",
        style: {
            width: 12,
            height: 12,
            "border-width": 1,
            "border-color": "#000",
            "border-opacity": 0.25,
            label: "",
            shape: "ellipse" as Css.NodeShape,
            "background-color": CONTINENT_COLORS["Unknown"],
        },
    },
    {
        selector: "node[population = 'ningaloo']",
        style: {
            shape: "rectangle" as Css.NodeShape,
            "background-color": NINGALOO_COLOR,
            "border-color": "#888",
            "border-opacity": 0.5,
        },
    },
    // Continent color rules for GBIF nodes
    ...Object.entries(CONTINENT_COLORS).map(
        ([continent, color]) =>
            ({
                selector: `node[population = 'gbif'][continent = '${continent}']`,
                style: { "background-color": color },
            }) as StylesheetStyle
    ),
    {
        selector: "edge",
        style: {
            display: "none" as Css.PropertyValue<EdgeSingular, "none" | "element">,
            width: 1,
            opacity: "data(opacity)" as unknown as number,
            "curve-style": "straight",
            "target-arrow-shape": "triangle",
            "arrow-scale": 0.8,
        },
    },
    {
        selector: "edge[edge_type = 'gbif_to_ningaloo']",
        style: {
            "line-color": GBIF_TO_NINGALOO_COLOR,
            "target-arrow-color": GBIF_TO_NINGALOO_COLOR,
            "source-arrow-color": GBIF_TO_NINGALOO_COLOR,
        },
    },
    {
        selector: "edge[edge_type = 'gbif_to_gbif']",
        style: {
            "line-color": GBIF_TO_GBIF_COLOR,
            "target-arrow-color": GBIF_TO_GBIF_COLOR,
            "source-arrow-color": GBIF_TO_GBIF_COLOR,
        },
    },
    {
        selector: "edge[?mutual]",
        style: { width: 2.5, "source-arrow-shape": "triangle" },
    },
    {
        selector: "node:active",
        style: { "overlay-opacity": 0 },
    },
];

export function normalizePositions(nodes: GraphNode[]): Map<string, { x: number; y: number }> {
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);

    const xMin = Math.min(...xs),
        xMax = Math.max(...xs);
    const yMin = Math.min(...ys),
        yMax = Math.max(...ys);

    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    const posMap = new Map<string, { x: number; y: number }>();
    for (const node of nodes) {
        posMap.set(node.id, {
            x: ((node.x - xMin) / xRange) * POSITION_SCALE,
            y: ((node.y - yMin) / yRange) * POSITION_SCALE,
        });
    }
    return posMap;
}

export function buildElements(
    nodes: GraphNode[],
    edges: GraphEdge[],
    posMap: Map<string, { x: number; y: number }>,
    sharkContinentMap: Map<string, string>
): ElementDefinition[] {
    const nodeEls: ElementDefinition[] = nodes.map((n) => ({
        data: {
            id: n.id,
            population: n.population,
            shark_id: n.shark_id,
            image_id: n.image_id,
            continent:
                n.population === "gbif"
                    ? (sharkContinentMap.get(n.shark_id) ?? "Unknown")
                    : undefined,
        },
        position: posMap.get(n.id) ?? { x: 0, y: 0 },
    }));

    const distances = edges.map((e) => e.distance);
    const dMin = Math.min(...distances);
    const dMax = Math.max(...distances);
    const dRange = dMax - dMin || 1;

    const edgeEls: ElementDefinition[] = edges.map((e) => ({
        data: {
            id: `${e.source}__${e.target}`,
            source: e.source,
            target: e.target,
            edge_type: e.edge_type,
            mutual: e.mutual,
            distance: e.distance,
            opacity: 1 - ((e.distance - dMin) / dRange) * (1 - EDGE_OPACITY_MIN),
        },
    }));

    return [...nodeEls, ...edgeEls];
}

// "*" matches every edge. Note that an empty-string selector would match nothing
function ambientEdgeSelector({ population, mutualOnly }: EdgeFilterState): string {
    const fragments: string[] = [];

    if (population === "same") fragments.push("[edge_type = 'gbif_to_gbif']");
    else if (population === "cross") fragments.push("[edge_type = 'gbif_to_ningaloo']");

    if (mutualOnly) fragments.push("[?mutual]");
    return fragments.length > 0 ? fragments.join("") : "*";
}

// Single source of truth for what's visible / highlighted
// Recomputes the whole view from scratch, so there's no "restore previous state"
// path to keep in sync (e.g. when defocusing back to the ambient filtered view)
export function applyGraphView(
    cy: Core,
    { nodeFilter, edgeFilter, continentFilters, focusedNodeId }: GraphViewParams
) {
    cy.batch(() => {
        cy.elements().removeStyle("opacity");
        cy.nodes().removeStyle("border-width border-color border-opacity");

        cy.nodes().style("display", "element");

        if (nodeFilter === "gbif") {
            cy.nodes("[population = 'ningaloo']").style("display", "none");
        } else if (nodeFilter === "ningaloo") {
            cy.nodes("[population = 'gbif']").style("display", "none");
        }

        if (continentFilters.size > 0) {
            // Hide GBIF nodes not in the selected set.
            // Chained != selectors are AND, so this matches nodes that aren't among the
            // selected continents (i.e. can filter on multiple continents)
            const hideSelector =
                "[population = 'gbif']" +
                [...continentFilters].map((c) => `[continent != '${c}']`).join("");
            cy.nodes(hideSelector).style("display", "none");
        }

        const ambientEdges = cy.edges(ambientEdgeSelector(edgeFilter));

        // A "mutual matches only" overview is only meaningful for nodes that
        // actually have one. Drop the rest so the clusters stand out
        if (edgeFilter.mutualOnly) {
            cy.nodes().not(ambientEdges.connectedNodes()).style("display", "none");
        }

        cy.edges().style("display", "none");
        ambientEdges.style("display", "element");

        const focusedNode = focusedNodeId ? cy.getElementById(focusedNodeId) : null;
        if (!focusedNode || focusedNode.empty()) return;

        // Clicking a node always reveals & highlights its full neighborhood, i.e.
        // its other images plus its closest match, regardless of ambient filters
        const sharkId = focusedNode.data("shark_id") as string;
        const sameSharkNodes = cy.nodes(`[shark_id = "${sharkId}"]`).not(focusedNode);

        const matchNeighborhood = focusedNode.closedNeighborhood();
        const allHighlighted = matchNeighborhood.nodes().union(sameSharkNodes);

        allHighlighted.style("display", "element");
        cy.nodes().not(allHighlighted).style("opacity", DIM_OPACITY);

        // Other visible-but-irrelevant ambient edges dim too, not just nodes
        ambientEdges.not(matchNeighborhood.edges()).style("opacity", DIM_OPACITY);
        matchNeighborhood.edges().style("display", "element").style("opacity", 1);

        focusedNode.style(HIGHLIGHT_BORDER);
        sameSharkNodes.style(SAME_SHARK_BORDER);
    });
}

function findBestMatch(cy: Core, nodeId: string): SelectedMatch | null {
    const clickedNode = cy.getElementById(nodeId);
    const outgoing = cy.edges(`[source = "${nodeId}"]`);

    // gbif_to_gbif and gbif_to_ningaloo distances come from separate FAISS
    // searches and aren't on a comparable scale, so the GBIF match always wins
    const gbifEdges = outgoing.filter("[edge_type = 'gbif_to_gbif']");
    const candidates = gbifEdges.length > 0 ? gbifEdges : outgoing;

    let bestEdge: EdgeSingular | null = null;
    let bestDist = Infinity;
    candidates.forEach((edge: EdgeSingular) => {
        const d = edge.data("distance") as number;
        if (d < bestDist) {
            bestDist = d;
            bestEdge = edge;
        }
    });

    if (!bestEdge) return null;

    const targetNode = cy.getElementById((bestEdge as EdgeSingular).data("target") as string);
    return {
        clickedSharkId: clickedNode.data("shark_id") as string,
        clickedImageId: parseInt(clickedNode.data("image_id"), 10),
        matchSharkId: targetNode.data("shark_id") as string,
        matchPopulation: targetNode.data("population") as "gbif" | "ningaloo",
        matchDistance: bestDist,
    };
}

export function initCyListeners(
    cy: Core,
    viewRef: { current: GraphViewParams },
    onSelect: (match: SelectedMatch | null) => void,
    onFocusChange: (nodeId: string | null) => void
) {
    // Listeners are registered once; read view params through a ref so taps
    // see latest values rather than what was captured at registration time
    cy.one("render", () => {
        cy.resize();
        cy.fit();
        applyGraphView(cy, viewRef.current);
    });

    cy.on("tap", (evt: EventObject) => {
        if (evt.target === cy) {
            onSelect(null);
            onFocusChange(null);
            return;
        }
        const target = evt.target as NodeSingular;
        if (!target.isNode()) return;

        const nodeId = target.id();
        onFocusChange(nodeId);

        if (target.data("population") !== "gbif") return;
        const match = findBestMatch(cy, nodeId);
        if (match) onSelect(match);
    });
}
