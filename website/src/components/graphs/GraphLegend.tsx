import { useState } from "react";

import { GraphLegendProps } from "../../types/graphs";

function GraphLegend({ colors, showNingaloo = false }: GraphLegendProps) {
    const [open, setOpen] = useState<boolean>(
        () => !window.matchMedia("(max-width: 900px)").matches
    );

    const regions = Object.entries(colors.continents)
        .filter(([name]) => name !== "Unknown")
        .sort(([a], [b]) => a.localeCompare(b));

    return (
        <div className="graph-legend">
            <button
                type="button"
                className="graph-legend-toggle"
                aria-expanded={open}
                onClick={() => setOpen((prev) => !prev)}
            >
                Key {open ? "▾" : "▴"}
            </button>

            {open && (
                <div className="graph-legend-items">
                    {regions.map(([name, color]) => (
                        <span key={name} className="legend-item">
                            <span className="legend-dot" style={{ background: color }} />
                            {name}
                        </span>
                    ))}

                    {showNingaloo && (
                        <span className="legend-item">
                            <span
                                className="legend-square"
                                style={{ background: colors.ningaloo }}
                            />
                            Ningaloo reference
                        </span>
                    )}

                    <span className="legend-item">
                        <span className="legend-dot legend-dot--contradiction" />
                        Contradiction (implies an impossible match)
                    </span>
                </div>
            )}
        </div>
    );
}

export default GraphLegend;
