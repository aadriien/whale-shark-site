import type { GraphThemeColors } from "../../types/graphs";

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
