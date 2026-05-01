import { OCEAN_DATASETS, sharkMarkerHtml } from "../../utils/OceanViewerUtils";


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
                <div dangerouslySetInnerHTML={{ __html: sharkMarkerHtml(config.sharkColor) }} />
                <span className="ocean-viewer-legend-text">Whale shark observation</span>
            </div>
        </div>
    );
};

export default OceanViewerLegend;

