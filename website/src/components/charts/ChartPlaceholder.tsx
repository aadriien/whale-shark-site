import overviewPlaceholder from "../../assets/images/chart-placeholders/overview.svg";
import barChartPlaceholder from "../../assets/images/chart-placeholders/bar-chart.svg";
import heatmapPlaceholder from "../../assets/images/chart-placeholders/heatmap.svg";
import radialHeatmapPlaceholder from "../../assets/images/chart-placeholders/radial-heatmap.svg";

import globeViewsPlaceholder from "../../assets/images/chart-placeholders/globe-views.svg";

import { ChartPlaceholderProps, ImageMap } from "../../types/charts";


const ChartPlaceholder = ({ type, message }: ChartPlaceholderProps) => {
    const imageMap: ImageMap = {
        overview: overviewPlaceholder,
        bar: barChartPlaceholder,
        heatmap: heatmapPlaceholder,
        radialHeatmap: radialHeatmapPlaceholder,

        globeViews: globeViewsPlaceholder,
    };

    return (
        <div className="chart-placeholder">
            <div className="chart-placeholder-image-wrapper">
                <img
                    src={imageMap[type]}
                    alt={`${type} chart illustration`}
                    className="chart-placeholder-image"
                />
            </div>
            {message !== "" && (
                <div className="chart-placeholder-message">
                    <p>{message}</p>
                </div>
            )}
        </div>
    );
};

export default ChartPlaceholder;

