import type { Core, Css, ElementDefinition, NodeSingular, StylesheetStyle } from "cytoscape";

import type {
    GraphNode,
    GraphEdge,
    ContradictionEntry,
    EdgeFilterState,
    GraphViewParams,
    GraphThemeColors,
    SelectedMatch,
    FilterKey,
} from "../types/graphs";

import { resolveFilters as resolveFiltersGeneric } from "./graph/filters";
import {
    normalizePositions as normalizePositionsCore,
    isDistanceFiltering as isDistanceFilteringCore,
    EDGE_OPACITY_MIN,
} from "./graph/layout";
import {
    buildClusterConflicts,
    conflictingSharkIdsFor,
    findContradictionPathGeneric,
} from "./graph/contradictions";
import { buildBaseStylesheet } from "./graph/stylesheet";
import { findBestMatchGeneric } from "./graph/bestMatch";
import { runApplyGraphView, initCyListenersGeneric } from "./graph/view";
import { getGraphColors } from "./graph/theme";

export { getGraphColors };

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
    saved_only: { gbif_only: true },
};

export type ResolvedFilters = {
    active: Set<FilterKey>;
    locked: Set<FilterKey>;
};

export function resolveFilters(userActive: Set<FilterKey>): ResolvedFilters {
    return resolveFiltersGeneric(userActive, FILTER_CONSTRAINTS);
}

export function normalizePositions(nodes: GraphNode[]): Map<string, { x: number; y: number }> {
    return normalizePositionsCore(nodes);
}

// Kept in sync with applyGraphView's baseNodeSize below, since the latter
// scales up from this as the stylesheet's starting point
const NODE_SIZE = 12;

// Builds the Cytoscape stylesheet from theme-aware colors
export function buildGraphStylesheet(colors: GraphThemeColors): StylesheetStyle[] {
    return buildBaseStylesheet(colors, {
        nodeSize: NODE_SIZE,
        continentNodeSelector: (continent) =>
            `node[population = 'gbif'][continent = '${continent}']`,
        extraNodeRules: [
            {
                selector: "node[population = 'ningaloo']",
                style: {
                    shape: "rectangle" as Css.NodeShape,
                    "background-color": colors.ningaloo,
                    "border-color": colors.ningalooBorder,
                    "border-opacity": colors.ningalooBorderOpacity,
                },
            },
        ],
        extraEdgeRules: [
            {
                selector: "edge[edge_type = 'gbif_to_ningaloo']",
                style: {
                    "line-color": colors.gbifToNingaloo,
                    "target-arrow-color": colors.gbifToNingaloo,
                    "source-arrow-color": colors.gbifToNingaloo,
                },
            },
            {
                selector: "edge[edge_type = 'gbif_to_gbif']",
                style: {
                    "line-color": colors.gbifToGbif,
                    "target-arrow-color": colors.gbifToGbif,
                    "source-arrow-color": colors.gbifToGbif,
                },
            },
        ],
    });
}

export function findContradictionPath(cy: Core, focusedNode: NodeSingular) {
    return findContradictionPathGeneric(cy, focusedNode, {
        edgeSelector: "[edge_type = 'gbif_to_gbif']",
        weightField: "distance",
    });
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
export const DISTANCE_RANGE_DEFAULT: [number, number] = [0, 4.0];

export function isDistanceFiltering(range: [number, number]): boolean {
    return isDistanceFilteringCore(range, DISTANCE_RANGE_DEFAULT);
}

function ambientEdgeSelector({ population, mutualOnly, distanceRange }: EdgeFilterState): string {
    const fragments: string[] = [];

    if (population === "same") fragments.push("[edge_type = 'gbif_to_gbif']");
    else if (population === "cross") fragments.push("[edge_type = 'gbif_to_ningaloo']");

    if (mutualOnly) fragments.push("[?mutual]");

    const [min, max] = distanceRange;
    if (min > DISTANCE_RANGE_DEFAULT[0]) fragments.push(`[distance >= ${min}]`);
    if (max < DISTANCE_RANGE_DEFAULT[1]) fragments.push(`[distance <= ${max}]`);

    return fragments.length > 0 ? fragments.join("") : "*";
}

export function applyGraphView(cy: Core, params: GraphViewParams) {
    const {
        nodeFilter,
        edgeFilter,
        continentFilters,
        focusedNodeId,
        noContradictions,
        contradictionsOnly,
        showContradictionPath,
        colors,
        savedOnly,
        savedSharkIds,
    } = params;

    const ambientSelector = ambientEdgeSelector(edgeFilter);
    const ambientEdges = cy.edges(ambientSelector);

    runApplyGraphView(cy, {
        hideEdges: edgeFilter.hideEdges,
        continentFilters,
        focusedNodeId,
        noContradictions,
        contradictionsOnly,
        showContradictionPath,
        colors,
        savedOnly,
        savedSharkIds,
        baseNodeSize: NODE_SIZE,
        edgeResetProps: "line-color target-arrow-color source-arrow-color width z-index",
        ambientSelector,
        ambientEdges,
        findContradictionPath,
        continentFilterPrefix: "[population = 'gbif']",
        applyNodeFilter: (c) => {
            if (nodeFilter === "gbif") {
                c.nodes("[population = 'ningaloo']").style("display", "none");
            } else if (nodeFilter === "ningaloo") {
                c.nodes("[population = 'gbif']").style("display", "none");
            }
        },
        // Sync displayed graph contents with cluster / contradiction choice
        syncActiveFields: (c) => {
            const useMutual = edgeFilter.mutualOnly;
            c.nodes().forEach((n) => {
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
        },
        getSiblingNodes: (c, focusedNode) => {
            const sharkId = focusedNode.data("shark_id") as string;
            return c.nodes(`[shark_id = "${sharkId}"]`).not(focusedNode);
        },
    });
}

export function findBestMatch(cy: Core, nodeId: string): SelectedMatch | null {
    return findBestMatchGeneric(cy, nodeId, {
        distanceField: "distance",
        // gbif_to_gbif and gbif_to_ningaloo distances come from separate FAISS
        // searches and aren't on a comparable scale, so the GBIF match always wins
        filterCandidates: (outgoing) => {
            const gbifEdges = outgoing.filter("[edge_type = 'gbif_to_gbif']");
            return gbifEdges.length > 0 ? gbifEdges : outgoing;
        },
        buildMatch: (clickedNode, targetNode, _bestEdge, bestDist) => {
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
        },
    });
}

export function initCyListeners(
    cy: Core,
    viewRef: { current: GraphViewParams },
    onSelect: (match: SelectedMatch | null) => void,
    onFocusChange: (nodeId: string | null) => void
) {
    initCyListenersGeneric(cy, viewRef, {
        applyView: applyGraphView,
        findBestMatch,
        onSelect,
        onFocusChange,
        shouldSelectMatch: (target) => target.data("population") === "gbif",
    });
}
