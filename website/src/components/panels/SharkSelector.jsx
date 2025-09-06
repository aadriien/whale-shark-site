import React, { useState } from "react";

import SharkFilter from "./SharkFilter.jsx";
import { filterSharks, extractUniqueSortedRegions } from "../../utils/FilterSharks.jsx";


function SharkSelector({ sharks, onReset, onSelect, selectedSharkId, DisplayComponent, disabled = false }) {
    // Compute filter options from data
    const countries = extractUniqueSortedRegions(sharks, "countries");
    const publishingCountries = extractUniqueSortedRegions(sharks, "publishing");

    const minRecords = Math.min(...sharks.map(s => s.occurrences || 1));
    const maxRecords = Math.max(...sharks.map(s => s.occurrences || 1));

    const allYears = sharks.flatMap(
        s => [parseInt(s.oldest), parseInt(s.newest)]
    ).filter(y => !isNaN(y));

    const minYear = Math.min(...allYears);
    const maxYear = Math.max(...allYears);

    // Memoize default criteria to prevent unnecessary re-initializations
    const defaultCriteria = React.useMemo(() => ({
        showOnlyWithMedia: false,
        country: "",
        yearRange: [String(minYear), String(maxYear)],
        hasOccurrenceNotes: false,
        minRecords: 1,
        sex: "",
        lifeStage: "",  
        publishingCountry: "", 
        observationType: "", 
    }), [minYear, maxYear]);
    
    const [criteria, setCriteria] = useState(defaultCriteria);
    const [showFilters, setShowFilters] = useState(true);

    const handleReset = () => {
        // Reset filters & close all continent tabs 
        setCriteria(defaultCriteria);
        setShowFilters(false);

        // Float cue back up to parent's reset
        if (onReset) onReset(); 
    };

    // Apply filters to get filtered sharks
    const filteredSharks = React.useMemo(() => {
        console.log("Computing filteredSharks with criteria:", criteria);
        const result = filterSharks(sharks, criteria);
        
        console.log(`filterSharks result: ${result.length}/${sharks.length} sharks`);
        return result;
    }, [sharks, criteria]);

    // Prepare filter options for SharkFilter component
    const filterOptions = {
        countries,
        publishingCountries,
        minYear,
        maxYear,
        minRecords,
        maxRecords
    };

    return (
        <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            height: "100%",
            opacity: disabled ? 0.6 : 1,
            pointerEvents: disabled ? "none" : "auto"
        }}>
            <div className="shark-selector-list">
                <button 
                    onClick={handleReset}
                    className={`show-all-button ${selectedSharkId == null ? "active" : ""}`}
                    disabled={disabled}
                >
                    Show All Sharks
                </button>

                <div className="filter-toggle-container">
                    <button 
                        onClick={() => setShowFilters((prev) => !prev)}
                        className={`toggle-filter-button ${showFilters ? "active" : ""}`}
                        disabled={disabled}
                    >
                        {showFilters ? "Hide Filters ▲" : "Show Filters ▼"}
                    </button>

                    {showFilters && (
                        <SharkFilter 
                            criteria={criteria} 
                            onChange={setCriteria} 
                            options={filterOptions}
                            disabled={disabled}
                        />
                    )}
                </div>

                <DisplayComponent 
                    sharks={filteredSharks}
                    onSelect={onSelect}
                    selectedSharkId={selectedSharkId}
                    disabled={disabled}
                />
            </div>
        </div>
    );
}

export default SharkSelector;


