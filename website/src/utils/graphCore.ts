import type {
    Core,
    Css,
    CollectionReturnValue,
    EdgeCollection,
    EdgeSingular,
    NodeCollection,
    NodeSingular,
    StylesheetStyle,
} from "cytoscape";

import type { GraphThemeColors } from "../types/graphs";

// Shared engine for the 2 Cytoscape-based graphs (SharkMatchGraph &
// SharkRankingGraph). Both graphs filter/highlight/pathfind the same way;
// where one graph has extra behavior the other doesn't (e.g. the image
// graph's population axis or same-shark sibling highlighting), that
// behavior is threaded through as an optional config hook rather than
// duplicated here.

// ---- Theme colors -------------------------------------------------------

// Cytoscape's style engine can't resolve CSS custom properties (e.g. var(--error)),
// so graph colors are defined per-theme here to match themes.css
const LIGHT_COLORS: GraphThemeColors = {
    contradiction: "#f44336",
    highlightBorder: "#ffd700",
    sameSharkBorder: "#2b2a2a",
    ningaloo: "#525252",
    gbifToNingaloo: "#f1d781",
    gbifToGbif: "#8fb9b5",
    nodeBorder: "#000",
    nodeBorderOpacity: 0.25,
    ningalooBorder: "#888",
    ningalooBorderOpacity: 0.5,
    dimOpacity: 0.08,
    continents: {
        "North America": "#f59f0b",
        Asia: "#15a347",
        Oceania: "#2266ed",
        Africa: "#f86c96",
        "South America": "#d30b0b",
        Europe: "#6b387c",
        Unknown: "#9CA3AF",
    },
};

const DARK_COLORS: GraphThemeColors = {
    contradiction: "#ef5350",
    highlightBorder: "#ffd700",
    sameSharkBorder: "#c0c0c0",
    ningaloo: "#a0a0a0",
    gbifToNingaloo: "#f5e0a0",
    gbifToGbif: "#a8d4cf",
    nodeBorder: "#999",
    nodeBorderOpacity: 0.4,
    ningalooBorder: "#bbb",
    ningalooBorderOpacity: 0.6,
    dimOpacity: 0.12,
    continents: {
        "North America": "#f5b740",
        Asia: "#22c95e",
        Oceania: "#4488ff",
        Africa: "#ff8aac",
        "South America": "#f03030",
        Europe: "#9560ab",
        Unknown: "#b0b8c4",
    },
};

export function getGraphColors(isDark: boolean): GraphThemeColors {
    return isDark ? DARK_COLORS : LIGHT_COLORS;
}

// ---- Filter constraint resolution -----------------------------------

export type ResolvedFilters<K extends string> = {
    active: Set<K>;
    locked: Set<K>;
};

// Propagates a constraint table to a fixed point, starting from the filters
// the user has directly turned on. Forced-on targets join `active`;
// forced-off targets are dropped from (+ kept out of) `active`. Any target
// forced by a filter OTHER than itself is `locked`, i.e. its button can't be
// toggled, since the constraint would just reassert itself.
//
// Exception: a key the user directly turned on is never locked, even if some
// OTHER active key's constraints force it back to the same value. Otherwise
// the user's own selection would become un-toggleable, with no way to undo it.
export function resolveFilters<K extends string>(
    userActive: Set<K>,
    constraints: Record<K, Partial<Record<K, boolean>>>
): ResolvedFilters<K> {
    const active = new Set(userActive);
    const forcedOff = new Set<K>();
    const locked = new Set<K>();

    let changed = true;
    while (changed) {
        changed = false;
        for (const key of [...active]) {
            if (!active.has(key)) continue;

            for (const [target, value] of Object.entries(constraints[key]) as [K, boolean | undefined][]) {
                const targetKey = target;
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

// ---- Layout / distance helpers ---------------------------------------

const POSITION_SCALE = 5000;
export const EDGE_OPACITY_MIN = 0.15;
export const HIGHLIGHT_Z_INDEX = 10;

export function normalizePositions<N extends { id: string; x: number; y: number }>(
    nodes: N[]
): Map<string, { x: number; y: number }> {
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

export function isDistanceFiltering(range: [number, number], defaultRange: [number, number]): boolean {
    return range[0] > defaultRange[0] || range[1] < defaultRange[1];
}

// ---- Contradiction cluster bookkeeping --------------------------------

export type ClusterConflictEntry = {
    cluster_id: number;
    conflicting_shark_ids: string[][];
};

// Per cluster_id, the set of whaleSharkID pairs flagged as mutually exclusive
export function buildClusterConflicts(entries: ClusterConflictEntry[]): Map<number, string[][]> {
    return new Map(entries.map((c) => [c.cluster_id, c.conflicting_shark_ids]));
}

// For a contradiction node, which other shark_id(s) in its cluster it's
// specifically flagged as conflicting with
export function conflictingSharkIdsFor(
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

// ---- Stylesheet --------------------------------------------------------

export type StylesheetConfig = {
    nodeSize?: number;
    // Baked directly into the base "edge" rule (for graphs with a single,
    // constant edge color). Graphs with edge-type-dependent coloring leave
    // this unset and supply `extraEdgeRules` instead.
    edgeLineColor?: string;
    continentNodeSelector?: (continent: string) => string;
    extraNodeRules?: StylesheetStyle[];
    extraEdgeRules?: StylesheetStyle[];
};

// Cytoscape's style engine can't resolve CSS custom properties (e.g. var(--error)),
// so graph colors are defined per-theme by the caller (see GraphUtils.ts) to
// match themes.css
export function buildBaseStylesheet(
    colors: GraphThemeColors,
    config: StylesheetConfig = {}
): StylesheetStyle[] {
    const {
        nodeSize = 12,
        edgeLineColor,
        continentNodeSelector = (continent) => `node[continent = '${continent}']`,
        extraNodeRules = [],
        extraEdgeRules = [],
    } = config;

    const edgeStyle: Record<string, unknown> = {
        display: "none" as Css.PropertyValue<EdgeSingular, "none" | "element">,
        width: 1,
        opacity: "data(opacity)" as unknown as number,
        "curve-style": "straight",
        "target-arrow-shape": "triangle",
        "arrow-scale": 0.8,
    };
    if (edgeLineColor) {
        edgeStyle["line-color"] = edgeLineColor;
        edgeStyle["target-arrow-color"] = edgeLineColor;
        edgeStyle["source-arrow-color"] = edgeLineColor;
    }

    return [
        {
            selector: "node",
            style: {
                width: nodeSize,
                height: nodeSize,
                "border-width": 1,
                "border-color": colors.nodeBorder,
                "border-opacity": colors.nodeBorderOpacity,
                label: "",
                shape: "ellipse" as Css.NodeShape,
                "background-color": colors.continents["Unknown"],
            },
        },
        ...extraNodeRules,
        // Continent color rules
        ...Object.entries(colors.continents).map(
            ([continent, color]) =>
                ({
                    selector: continentNodeSelector(continent),
                    style: { "background-color": color },
                }) as StylesheetStyle
        ),
        {
            selector: "edge",
            style: edgeStyle as StylesheetStyle["style"],
        },
        ...extraEdgeRules,
        {
            selector: "edge[?mutual]",
            style: { width: 2.5, "source-arrow-shape": "triangle" },
        },
        {
            selector: "node[?contradiction]",
            style: {
                "border-width": 3,
                "border-color": colors.contradiction,
                "border-style": "dashed" as Css.LineStyle,
                "border-opacity": 1,
            },
        },
        {
            selector: "node:active",
            style: { "overlay-opacity": 0 },
        },
    ];
}

// ---- Contradiction pathfinding ------------------------------------------

export type ContradictionPathResult = {
    targetNode: NodeSingular;
    pathElements: CollectionReturnValue;
};

// For a focused contradiction node, finds the nearest node in the same
// cluster whose shark_id is one of the focused node's conflicting_shark_ids,
// plus the chain of matches connecting the two (weighted by embedding
// distance, so the chain's weakest link is also its longest edge)
export function findContradictionPathGeneric(
    cy: Core,
    focusedNode: NodeSingular,
    config: {
        // Restricts which edges can participate in the cluster subgraph
        // (e.g. only gbif_to_gbif). Omit to allow all edges.
        edgeSelector?: string;
        weightField: string;
    }
): ContradictionPathResult | null {
    if (!focusedNode.data("contradiction")) return null;

    const clusterId = focusedNode.data("cluster_id") as number;
    const conflictingSharkIds = (focusedNode.data("conflicting_shark_ids") as string[]) ?? [];
    if (conflictingSharkIds.length === 0) return null;

    const clusterNodes = cy.nodes(`[cluster_id = ${clusterId}]`);
    const candidates = clusterNodes.filter((n) =>
        conflictingSharkIds.includes(n.data("shark_id") as string)
    );
    if (candidates.empty()) return null;

    const baseEdges = config.edgeSelector ? cy.edges(config.edgeSelector) : cy.edges();
    const clusterEdges = baseEdges.filter((e) => e.source().data("cluster_id") === clusterId);

    const dijkstra = clusterNodes.union(clusterEdges).dijkstra({
        root: focusedNode,
        weight: (edge) => edge.data(config.weightField) as number,
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

// ---- View application ---------------------------------------------------

export type ApplyGraphViewConfig = {
    hideEdges: boolean;
    continentFilters: Set<string>;
    focusedNodeId: string | null;
    noContradictions: boolean;
    contradictionsOnly: boolean;
    showContradictionPath: boolean;
    colors: GraphThemeColors;

    // Properties to clear from edges on every re-apply. Graphs that write
    // edge line-color inline (contradiction-path highlighting on top of
    // edge-type-dependent base coloring) need to reset it here too.
    edgeResetProps: string;
    ambientSelector: string;
    ambientEdges: EdgeCollection;
    findContradictionPath: (cy: Core, focusedNode: NodeSingular) => ContradictionPathResult | null;

    // Graph-specific hook points; omitted entirely by graphs that don't need them.
    syncActiveFields?: (cy: Core) => void;
    applyNodeFilter?: (cy: Core) => void;
    continentFilterPrefix?: string;
    getSiblingNodes?: (cy: Core, focusedNode: NodeSingular) => NodeCollection;
};

// Single source of truth for what's visible / highlighted. Recomputes the
// whole view from scratch, so there's no "restore previous state" path to
// keep in sync (e.g. when defocusing back to the ambient filtered view)
export function runApplyGraphView(cy: Core, config: ApplyGraphViewConfig) {
    const {
        hideEdges,
        continentFilters,
        focusedNodeId,
        noContradictions,
        contradictionsOnly,
        showContradictionPath,
        colors,
        edgeResetProps,
        ambientSelector,
        ambientEdges,
        findContradictionPath,
        syncActiveFields,
        applyNodeFilter,
        continentFilterPrefix,
        getSiblingNodes,
    } = config;

    cy.batch(() => {
        syncActiveFields?.(cy);

        cy.elements().removeStyle("opacity");
        cy.nodes().removeStyle("border-width border-color border-opacity border-style z-index");
        cy.edges().removeStyle(edgeResetProps);

        cy.nodes().style("display", "element");

        applyNodeFilter?.(cy);

        if (continentFilters.size > 0) {
            // Chained != selectors are AND, so this matches nodes that aren't among the
            // selected continents (i.e. can filter on multiple continents)
            const hideSelector =
                (continentFilterPrefix ?? "") +
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

        // A narrowed edge-population/mutual filter is only meaningful for
        // nodes that actually have a matching edge. Drop the rest so e.g.
        // the image graph's "GBIF x Ningaloo" filter shows only the
        // GBIF<->Ningaloo pairs (+ their Ningaloo targets), not every GBIF cluster
        if (ambientSelector !== "*") {
            cy.nodes().not(ambientEdges.connectedNodes()).style("display", "none");
        }

        // Only ambient edges are shown; hideEdges hides everything
        cy.edges().style("display", "none");
        if (!hideEdges) ambientEdges.style("display", "element");

        const focusedNode = focusedNodeId ? cy.getElementById(focusedNodeId) : null;
        if (!focusedNode || focusedNode.empty()) return;

        // Clicking a node always reveals & highlights its full neighborhood,
        // plus any sibling nodes (e.g. other images of the same shark),
        // regardless of ambient filters
        const matchNeighborhood = focusedNode.closedNeighborhood();
        const siblingNodes = getSiblingNodes ? getSiblingNodes(cy, focusedNode) : cy.collection();
        const allHighlighted = matchNeighborhood.nodes().union(siblingNodes);

        allHighlighted.style("display", "element").style("z-index", HIGHLIGHT_Z_INDEX);
        cy.nodes().not(allHighlighted).style("opacity", colors.dimOpacity);

        // Other visible-but-irrelevant ambient edges dim too, not just nodes
        ambientEdges.not(matchNeighborhood.edges()).style("opacity", colors.dimOpacity);
        matchNeighborhood
            .edges()
            .style("display", "element")
            .style("opacity", 1)
            .style("z-index", HIGHLIGHT_Z_INDEX);

        focusedNode.style({
            "border-width": 3,
            "border-color": colors.highlightBorder,
            "border-opacity": 1,
        });
        if (siblingNodes.length > 0) {
            siblingNodes.style({
                "border-width": 2,
                "border-color": colors.sameSharkBorder,
                "border-opacity": 1,
            });
        }

        // Pinpoint the specific node elsewhere in this cluster that the focused
        // node contradicts, and (optionally) the chain of matches between them
        const contradictionPath = findContradictionPath(cy, focusedNode);
        if (contradictionPath) {
            const { targetNode, pathElements } = contradictionPath;
            // The specific node, elsewhere in this cluster, whose shark_id contradicts
            // the focused node's (solid, vs. dashed "somewhere in here" cluster border)
            targetNode.style({
                "border-width": 4,
                "border-color": colors.contradiction,
                "border-style": "solid" as Css.LineStyle,
                "border-opacity": 1,
            });
            targetNode
                .style("display", "element")
                .style("opacity", 1)
                .style("z-index", HIGHLIGHT_Z_INDEX);

            if (showContradictionPath) {
                pathElements
                    .style("display", "element")
                    .style("opacity", 1)
                    .style("z-index", HIGHLIGHT_Z_INDEX);
                pathElements.edges().style({
                    width: 5,
                    "line-color": colors.contradiction,
                    "target-arrow-color": colors.contradiction,
                    "source-arrow-color": colors.contradiction,
                    opacity: 1,
                    "z-index": 999,
                });
            }
        }
    });
}

// ---- Best-match lookup ---------------------------------------------------

export function findBestMatchGeneric<TMatch>(
    cy: Core,
    nodeId: string,
    config: {
        distanceField: string;
        filterCandidates?: (outgoing: EdgeCollection) => EdgeCollection;
        buildMatch: (
            clickedNode: NodeSingular,
            targetNode: NodeSingular,
            bestEdge: EdgeSingular,
            bestDist: number
        ) => TMatch;
    }
): TMatch | null {
    const clickedNode = cy.getElementById(nodeId);
    const outgoing = cy.edges(`[source = "${nodeId}"]`);
    const candidates = config.filterCandidates ? config.filterCandidates(outgoing) : outgoing;

    let bestEdge: EdgeSingular | null = null;
    let bestDist = Infinity;
    candidates.forEach((edge: EdgeSingular) => {
        const d = edge.data(config.distanceField) as number;
        if (d < bestDist) {
            bestDist = d;
            bestEdge = edge;
        }
    });

    if (!bestEdge) return null;

    const targetNode = cy.getElementById((bestEdge as EdgeSingular).data("target") as string);
    return config.buildMatch(clickedNode, targetNode, bestEdge as EdgeSingular, bestDist);
}

// ---- Cytoscape event wiring ----------------------------------------------

export function initCyListenersGeneric<TViewParams, TMatch>(
    cy: Core,
    viewRef: { current: TViewParams },
    config: {
        applyView: (cy: Core, params: TViewParams) => void;
        findBestMatch: (cy: Core, nodeId: string) => TMatch | null;
        onSelect: (match: TMatch | null) => void;
        onFocusChange: (nodeId: string | null) => void;
        // Gate for whether a tapped node should attempt a match lookup
        // (e.g. only "gbif" population nodes have outgoing matches)
        shouldSelectMatch?: (target: NodeSingular) => boolean;
    }
) {
    const { applyView, findBestMatch, onSelect, onFocusChange, shouldSelectMatch } = config;

    // Listeners are registered once; read view params through a ref so taps
    // see latest values rather than what was captured at registration time
    cy.one("render", () => {
        cy.resize();
        cy.fit();
        applyView(cy, viewRef.current);
    });

    cy.on("tap", (evt) => {
        if (evt.target === cy) {
            onSelect(null);
            onFocusChange(null);
            return;
        }
        const target = evt.target as NodeSingular;
        if (!target.isNode()) return;

        const nodeId = target.id();
        onFocusChange(nodeId);

        if (shouldSelectMatch && !shouldSelectMatch(target)) return;
        const match = findBestMatch(cy, nodeId);
        if (match) onSelect(match);
    });
}