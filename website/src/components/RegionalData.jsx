import React, { useState, useMemo } from "react";
import * as d3 from "d3";

import RadialHeatmap from "./charts/RadialHeatmap.jsx";


const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


const reshapeRegionData = (rawData, metric) => {
    const reshaped = [];

    rawData.forEach(row => {
        months.forEach(month => {
            // Get occurrences for that specific month (cumulative over all time)
            const totalOccurrences = row[month];

            if (totalOccurrences != null && !Number.isNaN(+totalOccurrences)) {
                reshaped.push({
                    region: row[metric],
                    month,
                    "Total Occurrences": +totalOccurrences,
                    "Avg Per Year (all)": +row["Avg Per Year (all)"],
                    "Human Observation": +row["HUMAN_OBSERVATION"] || 0,
                    "Machine Observation": +row["MACHINE_OBSERVATION"] || 0
                });
            }
        });
    });

    return reshaped;
};
                

const GBIFRegionOccurrences = ({ regionData, metric }) => {
    const reshapedData = useMemo(() => reshapeRegionData(regionData, metric), []);
    const [selectedRegion, setSelectedRegion] = useState("");

    // Prep list of region options / views for selection
    const regionList = useMemo(() => {
        return [...new Set(reshapedData.map(d => d.region))].sort();
    }, [reshapedData]);

    const filteredData = useMemo(() => {
        return reshapedData.filter(d => d.region === selectedRegion);
    }, [reshapedData, selectedRegion]);

    // Get human vs machine observation percentages as pie chart data
    const getObservationTypeData = (selectedRegion) => {
        const entries = reshapedData.filter(d => d.region === selectedRegion);
    
        if (!entries.length) return [];
    
        const totalHuman = d3.sum(entries, d => d["Human Observation"]);
        const totalMachine = d3.sum(entries, d => d["Machine Observation"]);
        const total = totalHuman + totalMachine;
    
        return [
            { label: "Human Observation", value: (totalHuman / total) * 100 },
            { label: "Machine Observation", value: (totalMachine / total) * 100 }
        ];
    };
    
    const pieData = useMemo(() => {
        return getObservationTypeData(selectedRegion);
    }, [selectedRegion, reshapedData]);

    // Calculate total occurrences per month
    const getMonthOccurrences = (region) => {
        return reshapedData.filter(d => d.region === region)
            .reduce((accum, curr) => {
                months.forEach(month => {
                    accum[month] = (accum[month] || 0) + (curr[month] || 0);
                });
                return accum;
            }, {});
    };

    // Get occurrences for selected region
    const monthOccurrences = useMemo(() => {
        if (selectedRegion) {
            return getMonthOccurrences(selectedRegion);
        }
        return {};
    }, [selectedRegion, reshapedData]);

    return (
        <div className="region-occurrence-card" 
            style={{ 
                width: "100%", 
                height: "100%",
            }}
        >
            <label htmlFor="region-select" style={{ display: "block" }}>
                Select a {metric}:
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

            {filteredData.length > 0 ? (
                <>
                    <RadialHeatmap
                        data={filteredData}
                        segmentField="month"
                        ringField="Avg Per Year (all)"
                        valueField="Total Occurrences"
                        title={`Total Monthly Records — ${selectedRegion}`}
                        monthOccurrences={monthOccurrences}  
                        pieData={pieData}  
                    />
                </>
            ) : (
                <p style={{ textAlign: "center" }}>
                    {selectedRegion ? `No data available for this ${metric}.` : `Select a ${metric} to view data.`}
                </p>
            )}
        </div>
    );
};

export default GBIFRegionOccurrences;

