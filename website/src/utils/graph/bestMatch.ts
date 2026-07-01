import type { Core, EdgeCollection, EdgeSingular, NodeSingular } from "cytoscape";

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
