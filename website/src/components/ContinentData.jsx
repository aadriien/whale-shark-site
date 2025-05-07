import React, { useState, useMemo } from "react";
import * as d3 from "d3";

import RadialHeatmap from "./charts/RadialHeatmap.jsx";
import continentStatsGBIF from "../assets/data/json/gbif_continent_stats.json";


const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


const reshapeContinentData = (rawData) => {
    const reshaped = [];

    rawData.forEach(row => {
        months.forEach(month => {
            // Get occurrences for that specific month (cumulative over all time)
            const totalOccurrences = row[month];

            if (totalOccurrences != null && !Number.isNaN(+totalOccurrences)) {
                reshaped.push({
                    continent: row["continent"],
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
                

const GBIFContinentOccurrences = () => {
    const reshapedData = useMemo(() => reshapeContinentData(continentStatsGBIF), []);
    const [selectedContinent, setSelectedContinent] = useState("");

    // Prep list of continent options / views for selection
    const continentList = useMemo(() => {
        return [...new Set(reshapedData.map(d => d.continent))].sort();
    }, [reshapedData]);

    const filteredData = useMemo(() => {
        return reshapedData.filter(d => d.continent === selectedContinent);
    }, [reshapedData, selectedContinent]);

    // Get human vs machine observation percentages as pie chart data
    const getObservationTypeData = (selectedContinent) => {
        const entries = reshapedData.filter(d => d.continent === selectedContinent);
    
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
        return getObservationTypeData(selectedContinent);
    }, [selectedContinent, reshapedData]);

    // Calculate total occurrences per month
    const getMonthOccurrences = (continent) => {
        return reshapedData.filter(d => d.continent === continent)
            .reduce((accum, curr) => {
                months.forEach(month => {
                    accum[month] = (accum[month] || 0) + (curr[month] || 0);
                });
                return accum;
            }, {});
    };

    // Get occurrences for selected continent
    const monthOccurrences = useMemo(() => {
        if (selectedContinent) {
            return getMonthOccurrences(selectedContinent);
        }
        return {};
    }, [selectedContinent, reshapedData]);

    return (
        <div className="continent-occurrence-card" 
            style={{ 
                width: "100%", 
                height: "100%",
                minWidth: "300px",
                minHeight: "300px",
                padding: "0.5rem",
            }}
        >
            <label htmlFor="continent-select" style={{ display: "block" }}>
                Select a continent:
            </label>
            <select
                id="continent-select"
                value={selectedContinent}
                onChange={(e) => setSelectedContinent(e.target.value)}
            >
                <option value="">-- Choose a continent --</option>
                {continentList.map((continent) => (
                    <option key={continent} value={continent}>
                        {continent}
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
                        title={`Monthly Shark Records — ${selectedContinent}`}
                        monthOccurrences={monthOccurrences}  
                        pieData={pieData}  
                    />
                </>
            ) : (
                <p style={{ textAlign: "center" }}>
                    {selectedContinent ? "No data available for this continent." : "Select a continent to view data."}
                </p>
            )}
        </div>
    );
};

export default GBIFContinentOccurrences;

