import type { Core, CollectionReturnValue, NodeSingular } from "cytoscape";

import type { ContradictionEntry } from "../../types/graphs";

// Per cluster_id, the set of whaleSharkID pairs flagged as mutually exclusive
export function buildClusterConflicts(entries: ContradictionEntry[]): Map<number, string[][]> {
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
