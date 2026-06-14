import type {
    Core,
    Css,
    ElementDefinition,
    CollectionReturnValue,
    EdgeSingular,
    EventObject,
    NodeSingular,
    StylesheetStyle,
} from "cytoscape";

import type {
    GraphNode,
    GraphEdge,
    ContradictionEntry,
    EdgeFilterState,
    GraphViewParams,
    SelectedMatch,
} from "../types/graphs";

const POSITION_SCALE = 5000;
const EDGE_OPACITY_MIN = 0.15;

const DIM_OPACITY = 0.08;

// Cytoscape's style engine can't resolve CSS custom properties (e.g. var(--error)),
// so the contradiction color is hardcoded here to match themes.css's --error
const CONTRADICTION_COLOR = "#f44336";

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

// The specific node, elsewhere in this cluster, whose shark_id contradicts
// the focused node's (solid, vs. dashed "somewhere in here" cluster border)
const CONTRADICTION_TARGET_BORDER = {
    "border-width": 4,
    "border-color": CONTRADICTION_COLOR,
    "border-style": "solid" as Css.LineStyle,
    "border-opacity": 1,
} as const;

const CONTRADICTION_PATH_EDGE = {
    width: 5,
    "line-color": CONTRADICTION_COLOR,
    "target-arrow-color": CONTRADICTION_COLOR,
    "source-arrow-color": CONTRADICTION_COLOR,
    opacity: 1,
    "z-index": 999,
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
        selector: "node[?contradiction]",
        style: {
            "border-width": 3,
            "border-color": CONTRADICTION_COLOR,
            "border-style": "dashed" as Css.LineStyle,
            "border-opacity": 1,
        },
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

// For a focused contradiction node, finds the nearest node in the same
// cluster whose shark_id is one of focused node's conflicting_shark_ids,
// plus the chain of matches connecting the two (weighted by embedding
// distance, so the chain's weakest link is also its longest edge)
export function findContradictionPath(
    cy: Core,
    focusedNode: NodeSingular
): { targetNode: NodeSingular; pathElements: CollectionReturnValue } | null {
    if (!focusedNode.data("contradiction")) return null;

    const clusterId = focusedNode.data("cluster_id") as number;
    const conflictingSharkIds = (focusedNode.data("conflicting_shark_ids") as string[]) ?? [];
    if (conflictingSharkIds.length === 0) return null;

    const clusterNodes = cy.nodes(`[cluster_id = ${clusterId}]`);
    const candidates = clusterNodes.filter((n) =>
        conflictingSharkIds.includes(n.data("shark_id") as string)
    );
    if (candidates.empty()) return null;

    const clusterEdges = cy
        .edges("[edge_type = 'gbif_to_gbif']")
        .filter((e) => e.source().data("cluster_id") === clusterId);

    const dijkstra = clusterNodes.union(clusterEdges).dijkstra({
        root: focusedNode,
        weight: (edge) => edge.data("distance") as number,
        directed: false,
    });

    let targetNode: NodeSingular | null = null;
    let bestDist = Infinity;
    candidates.forEach((n) => {
        const d = dijkstra.distanceTo(n);
        if (d < bestDist) {
            bestDist = d;
            targetNode = n;
        }
    });
    if (!targetNode) return null;

    return { targetNode, pathElements: dijkstra.pathTo(targetNode) };
}

export function buildElements(
    nodes: GraphNode[],
    edges: GraphEdge[],
    posMap: Map<string, { x: number; y: number }>,
    sharkContinentMap: Map<string, string>,
    contradictions: ContradictionEntry[]
): ElementDefinition[] {
    // Per cluster_id, the set of whaleSharkIDs flagged as mutually exclusive
    const clusterConflicts = new Map<number, [string, string][]>(
        contradictions.map((c) => [c.cluster_id, c.conflicting_shark_ids])
    );

    const nodeEls: ElementDefinition[] = nodes.map((n) => {
        // For a contradiction node, which other shark_id(s) in its cluster
        // is it specifically flagged as conflicting with
        const conflictingSharkIds = n.contradiction
            ? [
                  ...new Set(
                      (clusterConflicts.get(n.cluster_id as number) ?? [])
                          .filter((pair) => pair.includes(n.shark_id))
                          .map((pair) => pair.find((id) => id !== n.shark_id) as string)
                  ),
              ]
            : [];

        return {
            data: {
                id: n.id,
                population: n.population,
                shark_id: n.shark_id,
                image_id: n.image_id,
                cluster_id: n.cluster_id,
                contradiction: n.contradiction,
                conflicting_shark_ids: conflictingSharkIds,
                continent:
                    n.population === "gbif"
                        ? (sharkContinentMap.get(n.shark_id) ?? "Unknown")
                        : undefined,
            },
            position: posMap.get(n.id) ?? { x: 0, y: 0 },
        };
    });

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
    {
        nodeFilter,
        edgeFilter,
        continentFilters,
        focusedNodeId,
        contradictionsOnly,
        showContradictionPath,
    }: GraphViewParams
) {
    cy.batch(() => {
        cy.elements().removeStyle("opacity");
        cy.nodes().removeStyle("border-width border-color border-opacity border-style");
        cy.edges().removeStyle("line-color target-arrow-color source-arrow-color width z-index");

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

        // Isolate clusters flagged by the contradiction-detection pass
        // (transitive chains of matches implying a geo/temporally impossible link)
        if (contradictionsOnly) {
            cy.nodes().not("[?contradiction]").style("display", "none");
        }

        const ambientEdges = cy.edges(ambientEdgeSelector(edgeFilter));

        // A "mutual matches only" overview is only meaningful for nodes that
        // actually have one. Drop the rest so the clusters stand out
        if (edgeFilter.mutualOnly) {
            cy.nodes().not(ambientEdges.connectedNodes()).style("display", "none");
        }

        cy.edges().style("display", "none");
        if (edgeFilter.showEdges) ambientEdges.style("display", "element");

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

        // Pinpoint the specific node elsewhere in this cluster that the focused
        // node contradicts, and (optionally) the chain of matches between them
        const contradictionPath = findContradictionPath(cy, focusedNode);
        if (contradictionPath) {
            const { targetNode, pathElements } = contradictionPath;
            targetNode.style(CONTRADICTION_TARGET_BORDER);
            targetNode.style("display", "element").style("opacity", 1);

            if (showContradictionPath) {
                pathElements.style("display", "element").style("opacity", 1);
                pathElements.edges().style(CONTRADICTION_PATH_EDGE);
            }
        }
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

    // Contradiction flags can land on any one of a shark's images, but the
    // images / match-tally panels list every image for this shark_id.
    // Pool conflicting_shark_ids across all of that shark's nodes (not just
    // clicked one), or a contradiction on a sibling image goes unflagged
    const sharkId = clickedNode.data("shark_id") as string;
    const sameSharkNodes = cy.nodes(`[shark_id = "${sharkId}"]`);
    const conflictingSharkIds = [
        ...new Set(
            sameSharkNodes
                .map((n) => (n.data("conflicting_shark_ids") as string[] | undefined) ?? [])
                .flat()
        ),
    ];

    return {
        clickedSharkId: sharkId,
        clickedImageId: parseInt(clickedNode.data("image_id"), 10),
        matchSharkId: targetNode.data("shark_id") as string,
        matchPopulation: targetNode.data("population") as "gbif" | "ningaloo",
        matchDistance: bestDist,
        conflictingSharkIds,
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
