import type { Core } from "cytoscape";


const NODE_DIM_OPACITY = 0.08;
const EDGE_DIM_OPACITY = 0.05;

const HIGHLIGHT_BORDER = {
    "border-width": 3,
    "border-color": "#ffd700",
    "border-opacity": 1,
} as const;


export function applyFocus(cy: Core, focusedNodeId: string | null): void {
    // removeStyle falls back to stylesheet, so edges recover their data (opacity) automatically
    cy.elements().removeStyle("opacity");
    cy.nodes().removeStyle("border-width border-color border-opacity");

    if (!focusedNodeId) return;

    const focusedNode = cy.getElementById(focusedNodeId);
    if (focusedNode.empty()) return;

    // closedNeighborhood == the node itself + its adjacent edges + adjacent nodes
    const featured = focusedNode.closedNeighborhood();
    const dimmed   = cy.elements().not(featured);

    dimmed.nodes().style("opacity", NODE_DIM_OPACITY);
    dimmed.edges().style("opacity", EDGE_DIM_OPACITY);
    featured.edges().style("opacity", 1);
    focusedNode.style(HIGHLIGHT_BORDER);
}
