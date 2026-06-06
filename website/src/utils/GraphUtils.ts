import type {
    Core,
    Css,
    ElementDefinition,
    EdgeSingular,
    EventObject,
    NodeSingular,
    StylesheetStyle,
} from "cytoscape";

import type { GraphNode, GraphEdge, NodeFilter, EdgeFilter, SelectedMatch } from "../types/graphs";

const POSITION_SCALE = 5000;
const EDGE_OPACITY_MIN = 0.15;

const NODE_DIM_OPACITY = 0.08;

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
            "target-arrow-shape": "none",
        },
    },
    {
        selector: "edge[edge_type = 'gbif_to_ningaloo']",
        style: { "line-color": "#3cb371" },
    },
    {
        selector: "edge[edge_type = 'gbif_to_gbif']",
        style: { "line-color": "#e8a020" },
    },
    {
        selector: "edge[?mutual]",
        style: { width: 2.5 },
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

export function applyFilters(
    cy: Core,
    nodeFilter: NodeFilter,
    edgeFilter: EdgeFilter,
    continentFilters: Set<string>
) {
    cy.batch(() => {
        cy.nodes().style("display", "element");
        cy.edges().style("display", "none");

        if (nodeFilter === "gbif") {
            cy.nodes("[population = 'ningaloo']").style("display", "none");
        } else if (nodeFilter === "ningaloo") {
            cy.nodes("[population = 'gbif']").style("display", "none");
        }

        // edgeFilter is preserved for future edge toggle; no-op while edges are hidden by default

        if (continentFilters.size > 0) {
            // Hide GBIF nodes not in the selected set.
            // Chained != selectors are AND, so this matches nodes that aren't among the
            // selected continents (i.e. can filter on multiple continents)
            const hideSelector =
                "[population = 'gbif']" +
                [...continentFilters].map((c) => `[continent != '${c}']`).join("");
            cy.nodes(hideSelector).style("display", "none");
        }
    });
}

export function applyFocus(cy: Core, focusedNodeId: string | null) {
    cy.elements().removeStyle("opacity");
    cy.nodes().removeStyle("border-width border-color border-opacity");
    // Always re-hide all edges, then selectively show neighborhood edges below
    cy.edges().style("display", "none");

    if (!focusedNodeId) return;

    const focusedNode = cy.getElementById(focusedNodeId);
    if (focusedNode.empty()) return;

    // Get the sharkID from the selected node in the graph.
    // Then highlight all other images (nodes) for that sharkID's record.
    // Also highlight the closest matched image (distinct shark),
    // showing the connection via an edge between the nodes
    const sharkId = focusedNode.data("shark_id") as string;
    const sameSharkNodes = cy.nodes(`[shark_id = "${sharkId}"]`).not(focusedNode);
    const matchNeighborhood = focusedNode.closedNeighborhood();

    const allHighlightedNodes = matchNeighborhood.nodes().union(sameSharkNodes);
    cy.nodes().not(allHighlightedNodes).style("opacity", NODE_DIM_OPACITY);

    matchNeighborhood.edges().style("display", "element").style("opacity", 1);
    focusedNode.style(HIGHLIGHT_BORDER);
    sameSharkNodes.style(SAME_SHARK_BORDER);
}

function findBestMatch(cy: Core, nodeId: string): SelectedMatch | null {
    const clickedNode = cy.getElementById(nodeId);
    let bestEdge: EdgeSingular | null = null;
    let bestDist = Infinity;

    cy.edges(`[source = "${nodeId}"]`).forEach((edge: EdgeSingular) => {
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
    nodeFilter: NodeFilter,
    edgeFilter: EdgeFilter,
    continentFilters: Set<string>,
    onSelect: (match: SelectedMatch | null) => void
) {
    cy.one("render", () => {
        cy.resize();
        cy.fit();
        applyFilters(cy, nodeFilter, edgeFilter, continentFilters);
    });

    cy.on("tap", (evt: EventObject) => {
        if (evt.target === cy) {
            onSelect(null);
            applyFocus(cy, null);
            return;
        }
        const target = evt.target as NodeSingular;
        if (!target.isNode()) return;

        const nodeId = target.id();
        applyFocus(cy, nodeId);

        if (target.data("population") !== "gbif") return;
        const match = findBestMatch(cy, nodeId);
        if (match) onSelect(match);
    });
}
