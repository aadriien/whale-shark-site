import { useEffect } from "react";
import type { RefObject } from "react";
import type { Core } from "cytoscape";

const FIT_PADDING_PX = 90;
const FIT_DURATION_MS = 350;

// Pans & zooms graph so a newly focused node (+ match) fill the canvas
export function useCyFocusCamera(cyRef: RefObject<Core | null>, focusedNodeId: string | null) {
    useEffect(() => {
        const cy = cyRef.current;
        if (!cy || !focusedNodeId) return;

        const node = cy.getElementById(focusedNodeId);
        if (node.empty()) return;

        const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? 0
            : FIT_DURATION_MS;
        const neighborhood = node.closedNeighborhood().nodes();

        cy.stop();

        // Lone node has nothing to frame, so keep current zoom & just center it
        if (neighborhood.length < 2) {
            cy.animate({ center: { eles: node }, duration });
            return;
        }

        cy.animate({
            fit: { eles: neighborhood, padding: FIT_PADDING_PX },
            duration,
            easing: "ease-in-out-cubic",
        });
    }, [cyRef, focusedNodeId]);
}
