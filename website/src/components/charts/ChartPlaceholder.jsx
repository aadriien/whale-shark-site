import overviewPlaceholder from "../../assets/images/chart-placeholders/overview.svg";
import barChartPlaceholder from "../../assets/images/chart-placeholders/bar-chart.svg";
import heatmapPlaceholder from "../../assets/images/chart-placeholders/heatmap.svg";
import radialHeatmapPlaceholder from "../../assets/images/chart-placeholders/radial-heatmap.svg";


const ChartPlaceholder = ({ type, message }) => {
    const imageMap = {
        overview: overviewPlaceholder,
        bar: barChartPlaceholder,
        heatmap: heatmapPlaceholder,
        radialHeatmap: radialHeatmapPlaceholder,
    };

    return (
        <div style={{ textAlign: "center", opacity: 0.8, padding: "1rem" }}>
            <img
                src={imageMap[type]}
                alt={`${type} chart illustration`}
                style={{ maxWidth: "150px", marginBottom: "0.5rem", opacity: 0.6 }}
            />
            <p>{message}</p>
        </div>
    );
};

export default ChartPlaceholder;
