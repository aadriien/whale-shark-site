import { useState, useEffect, useMemo } from "react";

import SharkFilter from "./SharkFilter";

import { filterSharks, extractUniqueSortedRegions } from "../../utils/FilterSharks";
import { FULLMONTHS } from "../../utils/DataUtils";

import { SharkFilterOptions, SharkBaseCriteria } from "../../types/filters";
import { SharkSelectorProps } from "../../types/panels";


function SharkSelector({ 
    sharks, 
    onReset, onSelect, 
    selectedSharkId, 
    DisplayComponent, 
    disabled = false,
    onFilteredSharksChange 
}: SharkSelectorProps) {
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

    const months = FULLMONTHS;

    // Memoize default criteria to prevent unnecessary re-initializations
    const defaultCriteria: SharkBaseCriteria = useMemo(() => ({
        country: "",
        publishingCountry: "", 
        yearRange: [String(minYear), String(maxYear)],
        month: "",
        sex: "",
        lifeStage: "", 
        minRecords: 1,
        observationType: "", 
        showOnlyWithMedia: false,
        hasOccurrenceNotes: false,
    }), [minYear, maxYear]);
    
    const [criteria, setCriteria] = useState<SharkBaseCriteria>(defaultCriteria);
    const [showFilters, setShowFilters] = useState<boolean>(true);

    const handleReset = () => {
        // Reset filters (but keep toggle state) & close all continent tabs
        setCriteria(defaultCriteria);

        // Float cue back up to parent's reset
        if (onReset) onReset(); 
    };

    // Apply filters to get filtered sharks
    const filteredSharks = useMemo(() => {
        console.log("Computing filteredSharks with criteria:", criteria);
        const result = filterSharks(sharks, criteria);
        
        console.log(`filterSharks result: ${result.length}/${sharks.length} sharks`);
        return result;
    }, [sharks, criteria]);
    
    // Notify parent of filtered sharks changes
    useEffect(() => {
        if (onFilteredSharksChange) {
            onFilteredSharksChange(filteredSharks);
        }
    }, [filteredSharks, onFilteredSharksChange]);

    // Prepare filter options for SharkFilter component
    const filterOptions: SharkFilterOptions = {
        countries,
        publishingCountries,
        minYear,
        maxYear,
        months,
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
                        />
                    )}
                </div>

                <DisplayComponent 
                    sharks={filteredSharks}
                    onSelect={onSelect}
                    selectedSharkId={selectedSharkId}
                />
            </div>
        </div>
    );
}

export default SharkSelector;


