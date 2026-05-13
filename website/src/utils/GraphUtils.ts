import type { 
    Core, 
    ElementDefinition, 
    EdgeSingular, 
    EventObject, 
    StylesheetStyle 
} from "cytoscape";

import type { 
    GraphNode, GraphEdge, 
    NodeFilter, EdgeFilter, 
    SelectedMatch 
} from "../types/graphs";


const POSITION_SCALE = 5000;
const EDGE_OPACITY_MIN = 0.15;

const NODE_DIM_OPACITY = 0.08;
const EDGE_DIM_OPACITY = 0.05;

const HIGHLIGHT_BORDER = {
    "border-width": 3,
    "border-color": "#ffd700",
    "border-opacity": 1,
} as const;


export const GRAPH_STYLESHEET: StylesheetStyle[] = [
    {
        selector: "node",
        style: {
            width: 12,
            height: 12,
            "border-width": 1,
            "border-color": "#000",
            "border-opacity": 1,
            label: "",
        },
    },
    {
        selector: "node[population = 'ningaloo']",
        style: { "background-color": "#4682b4" },
    },
    {
        selector: "node[population = 'gbif']",
        style: { "background-color": "#e8735a" },
    },
    {
        selector: "edge",
        style: {
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


export function normalizePositions(
    nodes: GraphNode[]
): Map<string, { x: number; y: number }> {
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);

    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);

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
): ElementDefinition[] {
    const nodeEls: ElementDefinition[] = nodes.map((n) => ({
        data: { 
            id: n.id, 
            population: n.population, 
            shark_id: n.shark_id, 
            image_id: n.image_id 
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
    edgeFilter: EdgeFilter
) {
    cy.batch(() => {
        cy.nodes().style("display", "element");
        cy.edges().style("display", "element");

        if (nodeFilter === "gbif") {
            cy.nodes("[population = 'ningaloo']").style("display", "none");
        } 
        else if (nodeFilter === "ningaloo") {
            cy.nodes("[population = 'gbif']").style("display", "none");
        }

        if (edgeFilter === "cross") {
            cy.edges("[edge_type != 'gbif_to_ningaloo']").style("display", "none");
        } 
        else if (edgeFilter === "same") {
            cy.edges("[edge_type != 'gbif_to_gbif']").style("display", "none");
        } 
        else if (edgeFilter === "mutual") {
            cy.edges("[?mutual != true]").style("display", "none");
        }
    });
}


export function applyFocus(cy: Core, focusedNodeId: string | null) {
    // removeStyle falls back to stylesheet, so edges recover data (opacity) automatically
    cy.elements().removeStyle("opacity");
    cy.nodes().removeStyle("border-width border-color border-opacity");

    if (!focusedNodeId) return;

    const focusedNode = cy.getElementById(focusedNodeId);
    if (focusedNode.empty()) return;

    const featured = focusedNode.closedNeighborhood();
    const dimmed   = cy.elements().not(featured);

    dimmed.nodes().style("opacity", NODE_DIM_OPACITY);
    dimmed.edges().style("opacity", EDGE_DIM_OPACITY);
    featured.edges().style("opacity", 1);
    focusedNode.style(HIGHLIGHT_BORDER);
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

    const targetNode = cy.getElementById(
        (bestEdge as EdgeSingular).data("target") as string
    );
    return {
        clickedSharkId:  clickedNode.data("shark_id") as string,
        clickedImageId:  parseInt(clickedNode.data("image_id"), 10),
        matchSharkId:    targetNode.data("shark_id") as string,
        matchPopulation: targetNode.data("population") as "gbif" | "ningaloo",
        matchDistance:   bestDist,
    };
}


export function initCyListeners(
    cy: Core,
    nodeFilter: NodeFilter,
    edgeFilter: EdgeFilter,
    onSelect: (match: SelectedMatch | null) => void,
) {
    cy.one("render", () => {
        cy.resize();
        cy.fit();
        applyFilters(cy, nodeFilter, edgeFilter);
    });

    cy.on("tap", (evt: EventObject) => {
        const target = evt.target as any;
        if (target === cy) {
            onSelect(null);
            applyFocus(cy, null);
            return;
        }
        if (typeof target.isNode !== "function" || !target.isNode()) return;

        const nodeId = target.id() as string;
        applyFocus(cy, nodeId);

        if (target.data("population") !== "gbif") return;
        const match = findBestMatch(cy, nodeId);
        if (match) onSelect(match);
    });
}


