import { OCEAN_DATASETS } from "../../utils/OceanViewerUtils";


const OceanViewerLegend = ( { datasetKey }: {datasetKey: string}) => {
    const config = OCEAN_DATASETS[datasetKey as keyof typeof OCEAN_DATASETS];

    const gradientStyle = {
        background: `linear-gradient(to right, ${
            config.gradientStops.map((v) => config.colorScale(v)).join(", ")
        })`,
    };

    return (
        <div className="ocean-viewer-legend">
            <div className="ocean-viewer-legend-row">
                <span className="ocean-viewer-legend-label">{config.label}</span>
                <div className="ocean-viewer-data-gradient" style={gradientStyle} />
                <div className="ocean-viewer-legend-range">
                    <span>low</span>
                    <span>high</span>
                </div>
            </div>

            <div className="ocean-viewer-legend-row">
                <svg width={12} height={12} viewBox="0 0 12 12">
                    <circle cx={6} cy={6} r={5} fill="#ff7700" stroke="#cc4400" strokeWidth={1.5} />
                </svg>
                <span className="ocean-viewer-legend-text">Whale shark observation</span>
            </div>
        </div>
    );
};

export default OceanViewerLegend;

