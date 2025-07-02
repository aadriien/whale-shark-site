import React, { useState, useMemo } from "react";

import GBIFRegionOccurrences from "./RegionalData.jsx";
import GBIFRegionAverages from "./RegionalAverages.jsx";
import countryStatsGBIF from "../../assets/data/json/gbif_country_stats.json";


const AVG_COLUMNS = [
    "Avg Per Year (all)",
    "Avg Per Year (after 2020)",
    "Avg Per Year (2010 - 2020)",
    "Avg Per Year (2000 - 2010)",
    "Avg Per Year (before 2000)",
];


const GBIFCountryOccurrences = ({ variant = "radial-heatmap" }) => {
    if (variant === "bar") {
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
                <GBIFRegionAverages 
                    regionData={countryStatsGBIF} 
                    metric={"country"} 
                />
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

