import React, { useState, useMemo } from "react";
import * as d3 from "d3";

import RadialHeatmap from "./charts/RadialHeatmap.jsx";
import countryStatsGBIF from "../assets/data/json/gbif_country_stats.json";


const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


const reshapeCountryData = (rawData) => {
    const reshaped = [];

    rawData.forEach(row => {
        months.forEach(month => {
            // Get occurrences for that specific month (cumulative over all time)
            const totalOccurrences = row[month];

            if (totalOccurrences != null && !Number.isNaN(+totalOccurrences)) {
                reshaped.push({
                    country: row["country"],
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
                

const GBIFCountryOccurrences = () => {
    const reshapedData = useMemo(() => reshapeCountryData(countryStatsGBIF), []);
    const [selectedCountry, setSelectedCountry] = useState("");

    // Prep list of country options / views for selection
    const countryList = useMemo(() => {
        return [...new Set(reshapedData.map(d => d.country))].sort();
    }, [reshapedData]);

    const filteredData = useMemo(() => {
        return reshapedData.filter(d => d.country === selectedCountry);
    }, [reshapedData, selectedCountry]);

    // Get human vs machine observation percentages as pie chart data
    const getObservationTypeData = (selectedCountry) => {
        const entries = reshapedData.filter(d => d.country === selectedCountry);
    
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
        return getObservationTypeData(selectedCountry);
    }, [selectedCountry, reshapedData]);

    // Calculate total occurrences per month
    const getMonthOccurrences = (country) => {
        return reshapedData.filter(d => d.country === country)
            .reduce((accum, curr) => {
                months.forEach(month => {
                    accum[month] = (accum[month] || 0) + (curr[month] || 0);
                });
                return accum;
            }, {});
    };

    // Get occurrences for selected country
    const monthOccurrences = useMemo(() => {
        if (selectedCountry) {
            return getMonthOccurrences(selectedCountry);
        }
        return {};
    }, [selectedCountry, reshapedData]);

    return (
        <div className="country-occurrence-card" 
            style={{ 
                width: "100%", 
                height: "100%",
                minWidth: "300px",
                minHeight: "300px",
                padding: "1rem",
            }}
        >
            <label htmlFor="country-select" style={{ display: "block" }}>
                Select a country:
            </label>
            <select
                id="country-select"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
            >
                <option value="">-- Choose a country --</option>
                {countryList.map((country) => (
                    <option key={country} value={country}>
                        {country}
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
                        title={`Total Monthly Records — ${selectedCountry}`}
                        monthOccurrences={monthOccurrences}  
                        pieData={pieData}  
                    />
                </>
            ) : (
                <p style={{ textAlign: "center" }}>
                    {selectedCountry ? "No data available for this country." : "Select a country to view data."}
                </p>
            )}
        </div>
    );
};

export default GBIFCountryOccurrences;

