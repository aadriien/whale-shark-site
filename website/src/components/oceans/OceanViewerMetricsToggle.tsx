import { useState } from "react";

import { OCEAN_DATASETS } from "../../utils/OceanViewerUtils";
import { OceanViewerMetricsToggleProps } from "../../types/oceans";


const OceanViewerMetricsToggle = ({ datasetKey, onDatasetChange }: OceanViewerMetricsToggleProps) => {
    const [expanded, setExpanded] = useState(false);

    const activeConfig = OCEAN_DATASETS[datasetKey as keyof typeof OCEAN_DATASETS];
    const activeGradient = {
        background: `linear-gradient(to bottom, ${
            activeConfig.gradientStops.map((v) => activeConfig.colorScale(v)).join(", ")
        })`,
    };

    return (
        <div className={`ocean-viewer-metrics${expanded ? " expanded" : ""}`}>
            <button
                className="ocean-viewer-metrics-toggle"
                onClick={() => setExpanded((e) => !e)}
                title={expanded ? "Collapse" : "Select metric"}
            >
                <span className="ocean-viewer-metrics-arrow">{expanded ? "‹" : "›"}</span>
                <div className="ocean-viewer-metrics-indicator" style={activeGradient} />
            </button>

            <div className="ocean-viewer-metrics-panel">
                <div className="ocean-viewer-metrics-heading">Ocean Metrics</div>

                {(Object.keys(OCEAN_DATASETS) as (keyof typeof OCEAN_DATASETS)[]).map((key) => {
                    const config = OCEAN_DATASETS[key];
                    const gradientStyle = {
                        background: `linear-gradient(to right, ${
                            config.gradientStops.map((v) => config.colorScale(v)).join(", ")
                        })`,
                    };
                    return (
                        <button
                            key={key}
                            className={`ocean-viewer-metric-option${key === datasetKey ? " active" : ""}`}
                            onClick={() => { onDatasetChange(key); setExpanded(false); }}
                        >
                            <div className="ocean-viewer-metric-gradient" style={gradientStyle} />
                            <span className="ocean-viewer-metric-label">{config.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default OceanViewerMetricsToggle;

