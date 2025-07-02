import React, { useState, useMemo } from "react";

import GBIFRegionOccurrences from "./RegionalData.jsx";
import BarChart from "../charts/BarChart.jsx";
import countryStatsGBIF from "../../assets/data/json/gbif_country_stats.json";


const AVG_COLUMNS = [
    "Avg Per Year (all)",
    "Avg Per Year (after 2020)",
    "Avg Per Year (2010 - 2020)",
    "Avg Per Year (2000 - 2010)",
    "Avg Per Year (before 2000)",
];


const GBIFCountryOccurrences = ({ variant = "region" }) => {
    const [selectedCountry, setSelectedCountry] = useState("");

    const countryList = useMemo(() => {
        return countryStatsGBIF.map((row) => row.country).sort();
    }, []);

    const barChartData = useMemo(() => {
        if (!selectedCountry) return [];

        const countryRow = countryStatsGBIF.find(
            (row) => row.country === selectedCountry
        );

        if (!countryRow) return [];

        // Map each avg column to { label, value }
        return AVG_COLUMNS.map((col) => ({
            label: col,
            value: Number(countryRow[col]) || 0,
        }));
    }, [selectedCountry]);

    if (variant === "bar") {
        return (
            <div
                className="card-data-wrapper"
                style={{
                    width: "100%",
                    height: "100%",
                    minWidth: "300px",
                    minHeight: "300px",
                    padding: "1rem 0.5rem",
            }}
            >
                <label htmlFor="country-select" style={{ display: "block" }}>
                    Select a <span style={{ fontWeight: "bold" }}>country</span>:
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

                {selectedCountry && barChartData.length > 0 ? (
                    <BarChart
                        data={barChartData}
                        title={`Mean Occurrences by Decade — ${selectedCountry}`}
                    />
                ) : (
                    <p style={{ textAlign: "center" }}>
                        {selectedCountry ? "No data available for this country." : "Select a country to view data."}
                    </p>
                )}
            </div>
        );
    }

    // Default radial heatmap mode
    return (
        <div className="card-data-wrapper" 
            style={{ 
                width: "100%", 
                height: "100%",
                minWidth: "300px",
                minHeight: "300px",
                padding: "1rem 0.5rem",
            }}
        >
            <GBIFRegionOccurrences 
                regionData={countryStatsGBIF} 
                metric={"country"} 
            />
        </div>
    );
};

export default GBIFCountryOccurrences;

