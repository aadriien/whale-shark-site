import { CHL_GRADIENT } from "../../utils/OceanViewerUtils";


const OceanViewerLegend = () => {
    return (
        <div className="ocean-viewer-legend">
            <div className="ocean-viewer-legend-row">
                <span className="ocean-viewer-legend-label">Chlorophyll (mg/m³)</span>
                <div className="ocean-viewer-chl-gradient" style={CHL_GRADIENT} />
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

