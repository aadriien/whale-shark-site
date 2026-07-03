import type { Core, ElementDefinition, NodeSingular, StylesheetStyle } from "cytoscape";

import type {
    GraphThemeColors,
    SharkRankingNode,
    SharkRankingEdge,
    ContradictionEntry,
    SharkRankingFilterKey,
    SharkRankingViewParams,
    SelectedSharkMatch,
} from "../types/graphs";

import { resolveFilters as resolveFiltersGeneric } from "./graph/filters";
import {
    normalizePositions as normalizePositionsCore,
    isDistanceFiltering as isDistanceFilteringCore,
    EDGE_OPACITY_MIN,
} from "./graph/layout";
import { buildClusterConflicts, conflictingSharkIdsFor, findContradictionPathGeneric } from "./graph/contradictions";
import { buildBaseStylesheet } from "./graph/stylesheet";
import { findBestMatchGeneric } from "./graph/bestMatch";
import { runApplyGraphView, initCyListenersGeneric } from "./graph/view";

// Filter dependency table: simpler than the image graph since there are
// no population (GBIF/Ningaloo) axes. Contradictions are structurally
// possible under all modes here; unlike image graph's mutual-only case,
// shark-level clusters can still form chains.
export const FILTER_CONSTRAINTS: Record<
    SharkRankingFilterKey,
    Partial<Record<SharkRankingFilterKey, boolean>>
> = {
    mutual_only: {},
    continents: {},
    no_contradictions: { contradictions_only: false },
    contradictions_only: { no_contradictions: false },
    hide_edges: {},
    saved_only: {},
};

export type ResolvedFilters = {
    active: Set<SharkRankingFilterKey>;
    locked: Set<SharkRankingFilterKey>;
};

export function resolveFilters(userActive: Set<SharkRankingFilterKey>): ResolvedFilters {
    return resolveFiltersGeneric(userActive, FILTER_CONSTRAINTS);
}

export function normalizePositions(
    nodes: SharkRankingNode[]
): Map<string, { x: number; y: number }> {
    return normalizePositionsCore(nodes);
}

// Kept in sync with applyGraphView's baseNodeSize below, since the latter
// scales up from this as the stylesheet's starting point
const NODE_SIZE = 14;

export function buildGraphStylesheet(colors: GraphThemeColors): StylesheetStyle[] {
    return buildBaseStylesheet(colors, {
        nodeSize: NODE_SIZE,
        edgeLineColor: colors.gbifToGbif,
    });
}

export function buildElements(
    nodes: SharkRankingNode[],
    edges: SharkRankingEdge[],
    posMap: Map<string, { x: number; y: number }>,
    sharkContinentMap: Map<string, string>,
    contradictions: ContradictionEntry[]
): ElementDefinition[] {
    const clusterConflicts = buildClusterConflicts(contradictions);

    const nodeEls: ElementDefinition[] = nodes.map((n) => {
        const conflicting = conflictingSharkIdsFor(
            clusterConflicts,
            n.cluster_id,
            n.contradiction,
            n.shark_id
        );

        return {
            data: {
                id: n.id,
                shark_id: n.shark_id,
                image_count: n.image_count,
                cluster_id: n.cluster_id,
                contradiction: n.contradiction,
                conflicting_shark_ids: conflicting,
                continent: sharkContinentMap.get(n.shark_id) ?? "Unknown",
            },
            position: posMap.get(n.id) ?? { x: 0, y: 0 },
        };
    });

    const medians = edges.map((e) => e.distance_median);
    const dMin = Math.min(...medians);
    const dMax = Math.max(...medians);
    const dRange = dMax - dMin || 1;

    const edgeEls: ElementDefinition[] = edges.map((e) => ({
        data: {
            id: `${e.source}__${e.target}`,
            source: e.source,
            target: e.target,
            mutual: e.mutual,
            distance_median: e.distance_median,
            distance_min: e.distance_min,
            distance_mean: e.distance_mean,
            distance_max: e.distance_max,
            pair_count: e.pair_count,
            opacity: 1 - ((e.distance_median - dMin) / dRange) * (1 - EDGE_OPACITY_MIN),
        },
    }));

    return [...nodeEls, ...edgeEls];
}

export const DISTANCE_RANGE_DEFAULT: [number, number] = [0, 2.0];

export function isDistanceFiltering(range: [number, number]): boolean {
    return isDistanceFilteringCore(range, DISTANCE_RANGE_DEFAULT);
}

function ambientEdgeSelector(mutualOnly: boolean, distanceRange: [number, number]): string {
    const fragments: string[] = [];

    if (mutualOnly) fragments.push("[?mutual]");

    const [min, max] = distanceRange;
    if (min > DISTANCE_RANGE_DEFAULT[0]) fragments.push(`[distance_median >= ${min}]`);
    if (max < DISTANCE_RANGE_DEFAULT[1]) fragments.push(`[distance_median <= ${max}]`);

    return fragments.length > 0 ? fragments.join("") : "*";
}

export function findContradictionPath(cy: Core, focusedNode: NodeSingular) {
    return findContradictionPathGeneric(cy, focusedNode, {
        weightField: "distance_median",
    });
}

export function applyGraphView(cy: Core, params: SharkRankingViewParams) {
    const {
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

    const ambientSelector = ambientEdgeSelector(edgeFilter.mutualOnly, edgeFilter.distanceRange);
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
        edgeResetProps: "width z-index",
        ambientSelector,
        ambientEdges,
        findContradictionPath,
    });
}

export function findBestMatch(cy: Core, nodeId: string): SelectedSharkMatch | null {
    return findBestMatchGeneric(cy, nodeId, {
        distanceField: "distance_median",
        buildMatch: (clickedNode, targetNode, bestEdge) => {
            const conflictingSharkIds = [
                ...new Set((clickedNode.data("conflicting_shark_ids") as string[] | undefined) ?? []),
            ];

            return {
                clickedSharkId: clickedNode.data("shark_id") as string,
                matchSharkId: targetNode.data("shark_id") as string,
                distanceMedian: bestEdge.data("distance_median") as number,
                distanceMin: bestEdge.data("distance_min") as number,
                distanceMean: bestEdge.data("distance_mean") as number,
                distanceMax: bestEdge.data("distance_max") as number,
                pairCount: bestEdge.data("pair_count") as number,
                isMutual: bestEdge.data("mutual") as boolean,
                conflictingSharkIds,
            };
        },
    });
}

export function initCyListeners(
    cy: Core,
    viewRef: { current: SharkRankingViewParams },
    onSelect: (match: SelectedSharkMatch | null) => void,
    onFocusChange: (nodeId: string | null) => void
) {
    initCyListenersGeneric(cy, viewRef, {
        applyView: applyGraphView,
        findBestMatch,
        onSelect,
        onFocusChange,
    });
}
