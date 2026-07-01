import type { Css, EdgeSingular, StylesheetStyle } from "cytoscape";

import type { GraphThemeColors } from "../../types/graphs";

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
