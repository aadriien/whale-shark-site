import React, { useState, useMemo } from "react";

import calendarStatsGBIF from "../../assets/data/json/gbif_calendar_stats.json";
import continentStatsGBIF from "../../assets/data/json/gbif_continent_stats.json";
import countryStatsGBIF from "../../assets/data/json/gbif_country_stats.json";
import publishingCountryStatsGBIF from "../../assets/data/json/gbif_publishingCountry_stats.json";


const datasets = {
    "calendar": calendarStatsGBIF,
    "continent": continentStatsGBIF,
    "country": countryStatsGBIF,
    "publishingCountry": publishingCountryStatsGBIF
}


const DataOverview = ({ 
    // Pre-fill with defaults in case not provided by parent 
    dataset = "calendar", 
    filterField = "year", 
    displayFields = [
        { label: "Total Occurrences", field: "Total Occurrences" },
        { label: "Unique Sharks (with ID)", field: "Unique Sharks (with ID)" },
        { label: "Top 3 Publishing Countries", field: "Top 3 Publishing Countries" }
    ]
}) => {
    const data = datasets[dataset] || [];
    
    // Extract unique filter options from dataset for dropdown
    const filterOptions = useMemo(() => {
        const uniqueValues = Array.from(new Set(data.map(d => d[filterField])));

        return uniqueValues.sort((a, b) => {
            // Maintain descending order if numeric
            if (typeof a === "number" && typeof b === "number") {
                return b - a;
            } 
            // Otherwise string alpha
            return String(a).localeCompare(String(b));
        });
    }, [data, filterField]);

    const [selectedFilter, setSelectedFilter] = useState("");

    const selectedData = useMemo(() => {
        // Force both to type string when comparing for search
        return data.find(d => String(d[filterField]) === String(selectedFilter));
    }, [data, filterField, selectedFilter]);
    
    return (
        <div className="card-data-wrapper" 
            style={{ 
                width: "100%",
                height: "100%",
                minWidth: "300px",
                minHeight: "300px",
                padding: "1rem 1rem",
            }}
        >
            <label htmlFor="filter-select" style={{ display: "block" }}>
                Select a <span style={{ fontWeight: "bold" }}>{filterField}</span>:
            </label>
            <select
                id="filter-select"
                value={selectedFilter}
                onChange={e => setSelectedFilter(e.target.value)}
            >
                <option value="">-- Choose a {filterField} --</option>
                {filterOptions.map(opt => (
                    <option key={String(opt)} value={String(opt)}>
                        {opt}
                    </option>
                ))}
            </select>
            
            {selectedData ? (
                <div className="data-overview-panel">
                    {displayFields.map(({ label, field, formatter }, i) => {
                        const value = selectedData[field];
                        return (
                            <div key={i} className={`data-overview-row${
                                i === displayFields.length - 1 ? " last" : ""
                            }`}>
                                <div className="data-overview-row-label">
                                    {label}
                                </div>
                                <div className="data-overview-row-value">
                                    {formatter ? formatter(value) : value}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p style={{ textAlign: "center" }}>
                    Select a {filterField} to view data.
                </p>
            )}
        </div>
    );
};

export default DataOverview;
