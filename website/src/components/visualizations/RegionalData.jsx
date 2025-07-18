import React, { useMemo } from "react";
import * as d3 from "d3";

import ChartPlaceholder from "../charts/ChartPlaceholder.jsx";
import RadialHeatmap from "../charts/RadialHeatmap.jsx";


const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


const capitalizeWords = (dataStr) => {
    const lowercase = dataStr.toLowerCase().replace(/_/g, " ").split(" ");
    const capitalizedWords = lowercase.map((word) => {
        if (word === "and") {
            return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
    });
    return capitalizedWords.join(" ");
};


const reshapeRegionData = (rawData, metric) => {
    const reshaped = [];

    rawData.forEach(row => {
        months.forEach(month => {
            // Get occurrences for that specific month (cumulative over all time)
            const totalOccurrences = row[month];

            if (totalOccurrences != null && !Number.isNaN(+totalOccurrences)) {
                reshaped.push({
                    region: capitalizeWords(row[metric]),
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
                

const GBIFRegionOccurrences = ({ regionData, metric, selectedRegion, onRegionChange }) => {
    // Reshape data once on mount or when regionData / metric change
    const reshapedData = useMemo(() => reshapeRegionData(regionData, metric), [regionData, metric]);

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
            {/* Filter select moved to parent. This component just displays the data */}

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
                selectedRegion ? (
                    <p style={{ textAlign: "center" }}>No data available for this {metric}.</p>
                ) : (
                    <ChartPlaceholder type="radialHeatmap" message={`Select a ${metric} to see monthly records`} />
                )
            )}
        </div>
    );
};

export default GBIFRegionOccurrences;
