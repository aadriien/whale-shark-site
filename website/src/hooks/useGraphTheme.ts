import { useEffect, useMemo, useState } from "react";
import type { StylesheetStyle } from "cytoscape";

import { getGraphColors } from "../utils/graphCore";
import type { GraphThemeColors } from "../types/graphs";

// Detects the current theme so Cytoscape (which can't read CSS vars) gets
// the right color set, & re-renders when the user toggles the theme
export function useGraphTheme(buildStylesheet: (colors: GraphThemeColors) => StylesheetStyle[]) {
    const [isDark, setIsDark] = useState(
        () => document.documentElement.getAttribute("data-theme") === "dark"
    );
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"],
        });
        return () => observer.disconnect();
    }, []);

    const colors = useMemo(() => getGraphColors(isDark), [isDark]);
    const stylesheet = useMemo(() => buildStylesheet(colors), [buildStylesheet, colors]);

    return { isDark, colors, stylesheet };
}
