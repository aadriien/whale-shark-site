import { useMemo } from "react";

import ChartPlaceholder from "../charts/ChartPlaceholder";
import BarChart from "../charts/BarChart";


const AVG_COLUMNS = [
    "Avg Per Year (all)",
    "Avg Per Year (after 2020)",
    "Avg Per Year (2010 - 2020)",
    "Avg Per Year (2000 - 2010)",
    "Avg Per Year (before 2000)",
];


const GBIFRegionAverages = ({ regionData, metric, selectedRegion }) => {
    const barChartData = useMemo(() => {
        if (!selectedRegion) return [];

        const regionRow = regionData.find(
            (row) => row[metric] === selectedRegion
        );

        if (!regionRow) return [];

        // Map each avg column to { label, value }
        return AVG_COLUMNS.map((col) => {
            // Ensure returned data has time range extracted, e.g. 2010 - 2020
            const match = col.match(/\((.*?)\)/);
            let label = match ? match[1] : col;

            if (label.toLowerCase() === "all") {
                label = "all time";
            }
            return {
                label: label,
                value: Number(regionRow[col]) || 0,
            };
        });
    }, [selectedRegion]);

    return (
        <div className="region-occurrence-card" 
            style={{ 
                width: "100%", 
                height: "100%",
            }}
        >
            {/* Filter handled in parent */}

            {selectedRegion && barChartData.length > 0 ? (
                <BarChart
                    data={barChartData}
                    title={`Mean Occurrences by Decade — ${selectedRegion}`}
                />
            ) : (
                selectedRegion ? (
                    <p style={{ textAlign: "center" }}>No data available for this ${metric}.</p>
                ) : (
                    <ChartPlaceholder type="bar" message={`Select a ${metric} to see records by decade`} />
                )
            )}
        </div>
    );
};

export default GBIFRegionAverages;

