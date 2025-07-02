import React, { useState, useMemo } from "react";
import BarChart from "../charts/BarChart.jsx";


const AVG_COLUMNS = [
    "Avg Per Year (all)",
    "Avg Per Year (after 2020)",
    "Avg Per Year (2010 - 2020)",
    "Avg Per Year (2000 - 2010)",
    "Avg Per Year (before 2000)",
];


const GBIFRegionAverages = ({ regionData, metric }) => {
    const [selectedRegion, setSelectedRegion] = useState("");

    const regionList = useMemo(() => {
        return regionData.map((row) => row[metric]).sort();
    }, [regionData, metric]);

    const barChartData = useMemo(() => {
        if (!selectedRegion) return [];

        const regionRow = regionData.find(
            (row) => row[metric] === selectedRegion
        );

        if (!regionRow) return [];

        // Map each avg column to { label, value }
        return AVG_COLUMNS.map((col) => ({
            label: col,
            value: Number(regionRow[col]) || 0,
        }));
    }, [selectedRegion]);

    return (
        <div className="region-occurrence-card" 
            style={{ 
                width: "100%", 
                height: "100%",
            }}
        >
            <label htmlFor="region-select" style={{ display: "block" }}>
                Select a <span style={{ fontWeight: "bold" }}>{metric}</span>:
            </label>
            <select
                id="region-select"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
            >
                <option value="">-- Choose a {metric} --</option>
                    {regionList.map((region) => (
                        <option key={region} value={region}>
                            {region}
                        </option>
                    ))}
            </select>

            {selectedRegion && barChartData.length > 0 ? (
                <BarChart
                    data={barChartData}
                    title={`Mean Occurrences by Decade — ${selectedRegion}`}
                />
            ) : (
                <p style={{ textAlign: "center" }}>
                    {selectedRegion ? `No data available for this ${metric}.` : `Select a ${metric} to view data.`}
                </p>
            )}
        </div>
    );
};

export default GBIFRegionAverages;

