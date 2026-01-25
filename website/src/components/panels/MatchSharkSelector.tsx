import { useState, useMemo } from "react";

import MatchFilter from "./MatchFilter";

import { filterVisionSharks, extractUniqueSortedRegions } from "../../utils/FilterSharks";
import { FULLMONTHS } from "../../utils/DataUtils";

import { MatchSharkSelectorProps } from "../../types/panels";
import { SharkCriteria } from "../../types/filters";


function MatchSharkSelector({ 
    sharks,
    onSharkSelect,
    selectedSharkId
}: MatchSharkSelectorProps) {
    // Compute filter options from shark data
    const countries = extractUniqueSortedRegions(sharks, "countries");

    const allYears = sharks.flatMap(
        s => [parseInt(s.oldest), parseInt(s.newest)]
    ).filter(y => !isNaN(y));

    const minYear = allYears.length > 0 ? Math.min(...allYears) : 2000;
    const maxYear = allYears.length > 0 ? Math.max(...allYears) : 2024;

    const months = FULLMONTHS;

    // Memoize default criteria (combined shark and match filters)
    const defaultCriteria: SharkCriteria = useMemo(() => ({
        // Location & time
        country: "",
        yearRange: [String(minYear), String(maxYear)],
        month: "",

        // Match quality
        miewidDistanceRange: [0, 5.0],
        showOnlyConfidentMatches: false,
        hasMatchedImages: false,
        plausibility: "",

        // Keep for filterSharks compatibility
        showOnlyWithMedia: false,
        hasOccurrenceNotes: false,
        minRecords: 1,
        sex: "",
        lifeStage: "",  
        publishingCountry: "", 
        observationType: "", 
    }), [minYear, maxYear]);
    
    const [criteria, setCriteria] = useState<SharkCriteria>(defaultCriteria);
    const [showFilters, setShowFilters] = useState<boolean>(true);

    const handleReset = () => {
        setCriteria(defaultCriteria);
    };

    // Apply all filters (shark + match quality)
    const filteredSharks = useMemo(() => {
        return filterVisionSharks(sharks, criteria);
    }, [sharks, criteria]);

    // Prepare filter options
    const filterOptions = {
        countries,
        minYear,
        maxYear,
        months,
    };

    return (
        <div className="match-shark-selector">
            <div className="match-selector-header">
                <h3>Shark Selection</h3>
                <button 
                    onClick={handleReset}
                    className="match-reset-filters-button"
                >
                    Reset Filters
                </button>
            </div>

            <button 
                onClick={() => setShowFilters((prev) => !prev)}
                className={`match-toggle-filter-button ${showFilters ? "active" : ""}`}
            >
                {showFilters ? "Hide Filters ▲" : "Show Filters ▼"}
            </button>

            {showFilters && (
                <div className="match-filters-section">
                    <MatchFilter 
                        criteria={criteria} 
                        onChange={setCriteria} 
                        options={filterOptions}
                    />
                </div>
            )}

            <div className="match-list-container">
                <div className="match-list-header">
                    <span>Showing {filteredSharks.length} of {sharks.length} sharks</span>
                </div>
                <div className="match-shark-list">
                    {filteredSharks.map((shark) => (
                        <div
                            key={shark.id}
                            className={`match-shark-item ${selectedSharkId === shark.id ? "selected" : ""}`}
                            onClick={() => onSharkSelect(shark.id)}
                        >
                            <div className="match-shark-id">ID: {shark.id || "N/A"}</div>
                            <div className="match-shark-meta">
                                {shark.countries || "Unknown"} | {shark.oldest || "N/A"}
                            </div>
                            <div>
                                {shark.miewid_match_distance && (
                                    <span className={`match-distance-value ${shark.miewid_match_distance < 1.0 ? "good" : "moderate"}`}>
                                        {shark.miewid_match_distance}
                                    </span>
                                )}
                                {shark.plausibility && (
                                    <span className={`match-plausibility plausibility-${shark.plausibility.toLowerCase()}`}>
                                        {shark.plausibility}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default MatchSharkSelector;

