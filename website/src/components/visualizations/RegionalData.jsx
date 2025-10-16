import { useMemo } from "react";
import * as d3 from "d3";

import ChartPlaceholder from "../charts/ChartPlaceholder.jsx";
import RadialHeatmap from "../charts/RadialHeatmap.jsx";

import { MONTHS } from "../../utils/DataUtils.js";


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
        MONTHS.forEach(month => {
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


// Get human vs machine observation percentages as pie chart data
const getObservationTypeData = (selectedRegion, reshapedData) => {
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


// Calculate total occurrences per month
const getMonthOccurrences = (region, reshapedData) => {
    return reshapedData.filter(d => d.region === region)
        .reduce((accum, curr) => {
            MONTHS.forEach(month => {
                accum[month] = (accum[month] || 0) + (curr[month] || 0);
            });
            return accum;
        }, {});
};
                

const GBIFRegionOccurrences = ({ regionData, metric, selectedRegion }) => {
    // Reshape data once on mount or when regionData / metric change
    const reshapedData = useMemo(() => reshapeRegionData(regionData, metric), [regionData, metric]);

    const filteredData = useMemo(() => {
        return reshapedData.filter(d => d.region === selectedRegion);
    }, [reshapedData, selectedRegion]);
    
    const pieData = useMemo(() => {
        return getObservationTypeData(selectedRegion, reshapedData);
    }, [selectedRegion, reshapedData]);

    // Get occurrences for selected region
    const monthOccurrences = useMemo(() => {
        if (selectedRegion) {
            return getMonthOccurrences(selectedRegion, reshapedData);
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
