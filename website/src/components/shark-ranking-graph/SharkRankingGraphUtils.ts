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

import type { GraphThemeColors } from "../../types/graphs";

import type {
    SharkRankingNode,
    SharkRankingEdge,
    SharkRankingContradiction,
    SharkRankingFilterKey,
    SharkRankingViewParams,
    SelectedSharkMatch,
} from "../../types/shark-ranking-graphs";

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
};

export type ResolvedFilters = {
    active: Set<SharkRankingFilterKey>;
    locked: Set<SharkRankingFilterKey>;
};

export function resolveFilters(userActive: Set<SharkRankingFilterKey>): ResolvedFilters {
    const active = new Set(userActive);
    const forcedOff = new Set<SharkRankingFilterKey>();
    const locked = new Set<SharkRankingFilterKey>();

    let changed = true;
    while (changed) {
        changed = false;
        for (const key of [...active]) {
            if (!active.has(key)) continue;

            for (const [target, value] of Object.entries(FILTER_CONSTRAINTS[key])) {
                const targetKey = target as SharkRankingFilterKey;
                if (value) {
                    if (!active.has(targetKey)) {
                        active.add(targetKey);
                        changed = true;
                    }
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
const HIGHLIGHT_Z_INDEX = 10;

export function buildGraphStylesheet(colors: GraphThemeColors): StylesheetStyle[] {
    return [
        {
            selector: "node",
            style: {
                width: 14,
                height: 14,
                "border-width": 1,
                "border-color": colors.nodeBorder,
                "border-opacity": colors.nodeBorderOpacity,
                label: "",
                shape: "ellipse" as Css.NodeShape,
                "background-color": colors.continents["Unknown"],
            },
        },
        ...Object.entries(colors.continents).map(
            ([continent, color]) =>
                ({
                    selector: `node[continent = '${continent}']`,
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
                "line-color": colors.gbifToGbif,
                "target-arrow-color": colors.gbifToGbif,
                "source-arrow-color": colors.gbifToGbif,
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

export function normalizePositions(
    nodes: SharkRankingNode[]
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

function buildClusterConflicts(
    contradictions: SharkRankingContradiction[]
): Map<number, string[][]> {
    return new Map(contradictions.map((c) => [c.cluster_id, c.conflicting_shark_ids]));
}

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
    nodes: SharkRankingNode[],
    edges: SharkRankingEdge[],
    posMap: Map<string, { x: number; y: number }>,
    sharkContinentMap: Map<string, string>,
    contradictions: SharkRankingContradiction[]
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
    return range[0] > DISTANCE_RANGE_DEFAULT[0] || range[1] < DISTANCE_RANGE_DEFAULT[1];
}

function ambientEdgeSelector(
    mutualOnly: boolean,
    distanceRange: [number, number]
): string {
    const fragments: string[] = [];

    if (mutualOnly) fragments.push("[?mutual]");

    const [min, max] = distanceRange;
    if (min > DISTANCE_RANGE_DEFAULT[0]) fragments.push(`[distance_median >= ${min}]`);
    if (max < DISTANCE_RANGE_DEFAULT[1]) fragments.push(`[distance_median <= ${max}]`);

    return fragments.length > 0 ? fragments.join("") : "*";
}

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
        .edges()
        .filter((e) => e.source().data("cluster_id") === clusterId);

    const dijkstra = clusterNodes.union(clusterEdges).dijkstra({
        root: focusedNode,
        weight: (edge) => edge.data("distance_median") as number,
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

export function applyGraphView(
    cy: Core,
    {
        edgeFilter,
        continentFilters,
        focusedNodeId,
        noContradictions,
        contradictionsOnly,
        showContradictionPath,
        colors,
    }: SharkRankingViewParams
) {
    cy.batch(() => {
        cy.elements().removeStyle("opacity");
        cy.nodes().removeStyle("border-width border-color border-opacity border-style z-index");
        cy.edges().removeStyle("width z-index");

        cy.nodes().style("display", "element");

        if (continentFilters.size > 0) {
            const hideSelector =
                [...continentFilters].map((c) => `[continent != '${c}']`).join("");
            cy.nodes(hideSelector).style("display", "none");
        }

        if (noContradictions) {
            cy.nodes("[?contradiction]").style("display", "none");
        } else if (contradictionsOnly) {
            cy.nodes().not("[?contradiction]").style("display", "none");
        }

        const ambientSelector = ambientEdgeSelector(
            edgeFilter.mutualOnly,
            edgeFilter.distanceRange
        );
        const ambientEdges = cy.edges(ambientSelector);

        if (ambientSelector !== "*") {
            cy.nodes().not(ambientEdges.connectedNodes()).style("display", "none");
        }

        cy.edges().style("display", "none");
        if (!edgeFilter.hideEdges) ambientEdges.style("display", "element");

        const focusedNode = focusedNodeId ? cy.getElementById(focusedNodeId) : null;
        if (!focusedNode || focusedNode.empty()) return;

        const matchNeighborhood = focusedNode.closedNeighborhood();

        matchNeighborhood.nodes().style("display", "element").style("z-index", HIGHLIGHT_Z_INDEX);
        cy.nodes().not(matchNeighborhood.nodes()).style("opacity", colors.dimOpacity);

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

        const contradictionPath = findContradictionPath(cy, focusedNode);
        if (contradictionPath) {
            const { targetNode, pathElements } = contradictionPath;
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

export function findBestMatch(cy: Core, nodeId: string): SelectedSharkMatch | null {
    const clickedNode = cy.getElementById(nodeId);
    const outgoing = cy.edges(`[source = "${nodeId}"]`);

    let bestEdge: EdgeSingular | null = null;
    let bestDist = Infinity;
    outgoing.forEach((edge: EdgeSingular) => {
        const d = edge.data("distance_median") as number;
        if (d < bestDist) {
            bestDist = d;
            bestEdge = edge;
        }
    });

    if (!bestEdge) return null;

    const targetNode = cy.getElementById((bestEdge as EdgeSingular).data("target") as string);

    const conflictingSharkIds = [
        ...new Set(
            ((clickedNode.data("conflicting_shark_ids") as string[] | undefined) ?? [])
        ),
    ];

    return {
        clickedSharkId: clickedNode.data("shark_id") as string,
        matchSharkId: targetNode.data("shark_id") as string,
        distanceMedian: (bestEdge as EdgeSingular).data("distance_median") as number,
        distanceMin: (bestEdge as EdgeSingular).data("distance_min") as number,
        distanceMean: (bestEdge as EdgeSingular).data("distance_mean") as number,
        distanceMax: (bestEdge as EdgeSingular).data("distance_max") as number,
        pairCount: (bestEdge as EdgeSingular).data("pair_count") as number,
        isMutual: (bestEdge as EdgeSingular).data("mutual") as boolean,
        conflictingSharkIds,
    };
}

export function initCyListeners(
    cy: Core,
    viewRef: { current: SharkRankingViewParams },
    onSelect: (match: SelectedSharkMatch | null) => void,
    onFocusChange: (nodeId: string | null) => void
) {
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

        const match = findBestMatch(cy, nodeId);
        if (match) onSelect(match);
    });
}