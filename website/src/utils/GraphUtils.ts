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
    FilterKey,
} from "../types/graphs";

// Filter dependency table: when a key is active, the listed targets are
// forced to that value (true = forced on, false = forced off) regardless of
// the user's own toggle for that target. Targets forced either way become
// "locked", i.e. their buttons are disabled, since toggling them would have
// no effect (resolution would just reassert the forced value).
export const FILTER_CONSTRAINTS: Record<FilterKey, Partial<Record<FilterKey, boolean>>> = {
    gbif_only: { gbif_gbif: true, gbif_ningaloo: false },
    ningaloo_only: {
        gbif_gbif: false,
        gbif_ningaloo: false,
        continents: false,
        mutual_only: false,
        no_contradictions: false,
        contradictions_only: false,
        hide_edges: true,
    },
    gbif_gbif: { gbif_only: true, ningaloo_only: false },
    gbif_ningaloo: {
        gbif_only: false,
        ningaloo_only: false,
        mutual_only: false,
        continents: false,
        no_contradictions: false,
        contradictions_only: false,
    },
    // Contradictions are structurally impossible under mutual-only clustering
    // (see assign_clusters in build_graph.py), so the contradiction-related
    // toggles are degenerate there and get locked off.
    mutual_only: { gbif_only: true, contradictions_only: false, no_contradictions: false },
    continents: { gbif_only: true },
    no_contradictions: { gbif_only: true, contradictions_only: false },
    contradictions_only: { gbif_only: true, mutual_only: false, no_contradictions: false },
    hide_edges: {},
};

export type ResolvedFilters = {
    active: Set<FilterKey>;
    locked: Set<FilterKey>;
};

// Propagates FILTER_CONSTRAINTS to a fixed point, starting from the filters
// the user has directly turned on. Forced-on targets join `active`;
// forced-off targets are dropped from (+ kept out of) `active`. Any target
// forced by a filter OTHER than itself is `locked`, i.e. its button can't be
// toggled, since the constraint would just reassert itself.
//
// Exception: a key the user directly turned on is never locked, even if some
// OTHER active key's constraints force it back to the same value (e.g.
// gbif_only <-> gbif_gbif force each other). Otherwise the user's own
// selection would become un-toggleable, with no way to undo it.
export function resolveFilters(userActive: Set<FilterKey>): ResolvedFilters {
    const active = new Set(userActive);
    const forcedOff = new Set<FilterKey>();
    const locked = new Set<FilterKey>();

    let changed = true;
    while (changed) {
        changed = false;
        for (const key of [...active]) {
            if (!active.has(key)) continue;

            for (const [target, value] of Object.entries(FILTER_CONSTRAINTS[key as FilterKey])) {
                const targetKey = target as FilterKey;
                if (value) {
                    if (!active.has(targetKey)) {
                        active.add(targetKey);
                        changed = true;
                    }
                    // Mutual reinforcement (target forced to the same "on" state
                    // the user already chose) doesn't lock it, so it stays
                    // toggleable. A forced-off target always conflicts with the
                    // user's choice, so it's locked regardless.
                    if (targetKey !== key && !userActive.has(targetKey)) locked.add(targetKey);
                } else {
                    if (!forcedOff.has(targetKey)) {
                        forcedOff.add(targetKey);
                        changed = true;
                    }
                    if (active.delete(targetKey)) changed = true;
                    if (targetKey !== key) locked.add(targetKey);
                }
            }
        }
    }

    return { active, locked };
}

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
    "border-color": "#2b2a2a",
    "border-opacity": 1,
} as const;

const HIGHLIGHT_Z_INDEX = 10;

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

const GBIF_TO_NINGALOO_COLOR = "#f1d781";
const GBIF_TO_GBIF_COLOR = "#8fb9b5";

export const CONTINENT_COLORS: Record<string, string> = {
    "North America": "#f59f0b",
    Asia: "#15a347",
    Oceania: "#2266ed",
    Africa: "#f86c96",
    "South America": "#d30b0b",
    Europe: "#6b387c",
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

// Per cluster_id, the set of whaleSharkIDs flagged as mutually exclusive
function buildClusterConflicts(contradictions: ContradictionEntry[]): Map<number, string[][]> {
    return new Map(contradictions.map((c) => [c.cluster_id, c.conflicting_shark_ids]));
}

// For a contradiction node, which other shark_id(s) in its cluster it's
// specifically flagged as conflicting with
function conflictingSharkIdsFor(
    clusterConflicts: Map<number, string[][]>,
    clusterId: number | null,
    contradiction: boolean,
    sharkId: string
): string[] {
    if (!contradiction) return [];
    return [
        ...new Set(
            (clusterConflicts.get(clusterId as number) ?? [])
                .filter((pair) => pair.includes(sharkId))
                .map((pair) => pair.find((id) => id !== sharkId) as string)
        ),
    ];
}

export function buildElements(
    nodes: GraphNode[],
    edges: GraphEdge[],
    posMap: Map<string, { x: number; y: number }>,
    sharkContinentMap: Map<string, string>,
    contradictionsMutual: ContradictionEntry[],
    contradictionsAll: ContradictionEntry[]
): ElementDefinition[] {
    const clusterConflictsMutual = buildClusterConflicts(contradictionsMutual);
    const clusterConflictsAll = buildClusterConflicts(contradictionsAll);

    const nodeEls: ElementDefinition[] = nodes.map((n) => {
        const conflictingMutual = conflictingSharkIdsFor(
            clusterConflictsMutual,
            n.cluster_id_mutual,
            n.contradiction_mutual,
            n.shark_id
        );
        const conflictingAll = conflictingSharkIdsFor(
            clusterConflictsAll,
            n.cluster_id_all,
            n.contradiction_all,
            n.shark_id
        );

        return {
            data: {
                id: n.id,
                population: n.population,
                shark_id: n.shark_id,
                image_id: n.image_id,
                cluster_id_mutual: n.cluster_id_mutual,
                cluster_id_all: n.cluster_id_all,
                contradiction_mutual: n.contradiction_mutual,
                contradiction_all: n.contradiction_all,
                conflicting_shark_ids_mutual: conflictingMutual,
                conflicting_shark_ids_all: conflictingAll,
                // "Active" fields, kept in sync with the mutual-only toggle
                // by applyGraphView. Initialized to the "all matches" view,
                // matching the default mutualOnly = false state.
                cluster_id: n.cluster_id_all,
                contradiction: n.contradiction_all,
                conflicting_shark_ids: conflictingAll,
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
        noContradictions,
        contradictionsOnly,
        showContradictionPath,
    }: GraphViewParams
) {
    cy.batch(() => {
        // Sync displayed graph contents with cluster / contradiction choice
        const useMutual = edgeFilter.mutualOnly;
        cy.nodes().forEach((n) => {
            n.data(
                "cluster_id",
                useMutual ? n.data("cluster_id_mutual") : n.data("cluster_id_all")
            );
            n.data(
                "contradiction",
                useMutual ? n.data("contradiction_mutual") : n.data("contradiction_all")
            );
            n.data(
                "conflicting_shark_ids",
                useMutual
                    ? n.data("conflicting_shark_ids_mutual")
                    : n.data("conflicting_shark_ids_all")
            );
        });

        cy.elements().removeStyle("opacity");
        cy.nodes().removeStyle("border-width border-color border-opacity border-style z-index");
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
        if (noContradictions) {
            cy.nodes("[?contradiction]").style("display", "none");
        } else if (contradictionsOnly) {
            cy.nodes().not("[?contradiction]").style("display", "none");
        }

        const ambientSelector = ambientEdgeSelector(edgeFilter);
        const ambientEdges = cy.edges(ambientSelector);

        // A narrowed edge-population/mutual filter is only meaningful for
        // nodes that actually have a matching edge. Drop the rest so e.g.
        // "GBIF x Ningaloo" shows only the GBIF<->Ningaloo pairs (and their
        // Ningaloo targets), not every GBIF cluster too
        if (ambientSelector !== "*") {
            cy.nodes().not(ambientEdges.connectedNodes()).style("display", "none");
        }

        // Only ambient edges are shown; hideEdges hides everything
        cy.edges().style("display", "none");
        if (!edgeFilter.hideEdges) ambientEdges.style("display", "element");

        const focusedNode = focusedNodeId ? cy.getElementById(focusedNodeId) : null;
        if (!focusedNode || focusedNode.empty()) return;

        // Clicking a node always reveals & highlights its full neighborhood, i.e.
        // its other images plus its closest match, regardless of ambient filters
        const sharkId = focusedNode.data("shark_id") as string;
        const sameSharkNodes = cy.nodes(`[shark_id = "${sharkId}"]`).not(focusedNode);

        const matchNeighborhood = focusedNode.closedNeighborhood();
        const allHighlighted = matchNeighborhood.nodes().union(sameSharkNodes);

        allHighlighted.style("display", "element").style("z-index", HIGHLIGHT_Z_INDEX);
        cy.nodes().not(allHighlighted).style("opacity", DIM_OPACITY);

        // Other visible-but-irrelevant ambient edges dim too, not just nodes
        ambientEdges.not(matchNeighborhood.edges()).style("opacity", DIM_OPACITY);
        matchNeighborhood
            .edges()
            .style("display", "element")
            .style("opacity", 1)
            .style("z-index", HIGHLIGHT_Z_INDEX);

        focusedNode.style(HIGHLIGHT_BORDER);
        sameSharkNodes.style(SAME_SHARK_BORDER);

        // Pinpoint the specific node elsewhere in this cluster that the focused
        // node contradicts, and (optionally) the chain of matches between them
        const contradictionPath = findContradictionPath(cy, focusedNode);
        if (contradictionPath) {
            const { targetNode, pathElements } = contradictionPath;
            targetNode.style(CONTRADICTION_TARGET_BORDER);
            targetNode
                .style("display", "element")
                .style("opacity", 1)
                .style("z-index", HIGHLIGHT_Z_INDEX);

            if (showContradictionPath) {
                pathElements
                    .style("display", "element")
                    .style("opacity", 1)
                    .style("z-index", HIGHLIGHT_Z_INDEX);
                pathElements.edges().style(CONTRADICTION_PATH_EDGE);
            }
        }
    });
}

export function findBestMatch(cy: Core, nodeId: string): SelectedMatch | null {
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

    // Which of this shark's images carry the contradiction themselves
    // (as opposed to merely sharing a cluster with one)
    const contradictionImageIds = sameSharkNodes
        .filter(
            (n) =>
                n.data("contradiction") &&
                ((n.data("conflicting_shark_ids") as string[] | undefined) ?? []).length > 0
        )
        .map((n) => n.data("image_id") as number);

    return {
        clickedSharkId: sharkId,
        clickedImageId: parseInt(clickedNode.data("image_id"), 10),
        matchSharkId: targetNode.data("shark_id") as string,
        matchPopulation: targetNode.data("population") as "gbif" | "ningaloo",
        matchDistance: bestDist,
        conflictingSharkIds,
        contradictionImageIds,
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
