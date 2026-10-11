import { GraphHeaderProps } from "../../types/graphs";

function GraphHeader({ title, description, colors, showNingaloo = false }: GraphHeaderProps) {
    const regions = Object.entries(colors.continents).filter(([name]) => name !== "Unknown");

    return (
        <div className="graph-header">
            <h2>{title}</h2>
            <p>{description}</p>

            <div className="graph-legend">
                {regions.map(([name, color]) => (
                    <span key={name} className="legend-item">
                        <span className="legend-dot" style={{ background: color }} />
                        {name}
                    </span>
                ))}

                {showNingaloo && (
                    <span className="legend-item">
                        <span className="legend-square" style={{ background: colors.ningaloo }} />
                        Ningaloo reference
                    </span>
                )}

                <span className="legend-item">
                    <span className="legend-dot legend-dot--contradiction" />
                    Contradiction (implies an impossible match)
                </span>
            </div>
        </div>
    );
}

export default GraphHeader;
