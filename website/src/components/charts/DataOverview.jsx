import React, { useMemo } from "react";

import ChartPlaceholder from "../charts/ChartPlaceholder.jsx";

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
    ],
    selectedFilter = "", // expect selectedFilter from parent now
}) => {
    const data = datasets[dataset] || [];
    
    // NOTE: Removed filter dropdown and its state

    const selectedData = useMemo(() => {
        // Force both to type string when comparing for search
        return data.find(d => String(d[filterField]) === String(selectedFilter));
    }, [data, filterField, selectedFilter]);
    
    return (
        <>
            {/* Filter dropdown removed - controlled externally */}

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
                selectedFilter ? (
                    <p style={{ textAlign: "center" }}>No data available for this {filterField}.</p>
                ) : (
                    <ChartPlaceholder type="overview" message={`Select a ${filterField} to see data overview`} />
                )
            )}
        </>
    );
};

export default DataOverview;
