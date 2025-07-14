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
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                height: "100%",
                textAlign: "center",
                padding: "2rem 1rem",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    height: "70%",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <img
                    src={imageMap[type]}
                    alt={`${type} chart illustration`}
                    style={{
                        maxHeight: "100%",
                        maxWidth: "100%",
                        objectFit: "contain",
                        opacity: "0.7",
                    }}
                />
            </div>
            <div
                style={{
                    height: "30%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: "0.9",
                }}
            >
                <p style={{ margin: 0 }}>{message}</p>
            </div>
        </div>
    );
};

export default ChartPlaceholder;
