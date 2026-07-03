import type { Core, Css, EdgeCollection, NodeCollection, NodeSingular } from "cytoscape";

import type { GraphThemeColors } from "../../types/graphs";

import type { ContradictionPathResult } from "./contradictions";

export const HIGHLIGHT_Z_INDEX = 10;

export type ApplyGraphViewConfig = {
    hideEdges: boolean;
    continentFilters: Set<string>;
    focusedNodeId: string | null;
    noContradictions: boolean;
    contradictionsOnly: boolean;
    showContradictionPath: boolean;
    colors: GraphThemeColors;
    savedOnly: boolean;
    savedSharkIds: Set<string>;

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
        savedOnly,
        savedSharkIds,
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

        if (savedOnly) {
            cy.nodes()
                .filter((n) => !savedSharkIds.has(n.data("shark_id") as string))
                .style("display", "none");
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
        // GBIF<->Ningaloo pairs (and their Ningaloo targets), not every GBIF cluster too
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
