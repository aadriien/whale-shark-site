import { useState, useEffect, useMemo } from "react";

import MatchFilter from "./MatchFilter.jsx";

import { filterSharks, extractUniqueSortedRegions } from "../../utils/FilterSharks.jsx";
import { FULLMONTHS } from "../../utils/DataUtils";


function MatchSharkSelector({ 
    sharks,
    mediaMatches,
    onSharkSelect,
    selectedSharkId,
    onFilteredSharksChange 
}) {
    // Compute filter options from shark data
    const countries = extractUniqueSortedRegions(sharks, "countries");
    const publishingCountries = extractUniqueSortedRegions(sharks, "publishing");

    const minRecords = Math.min(...sharks.map(s => s.occurrences || 1));
    const maxRecords = Math.max(...sharks.map(s => s.occurrences || 1));

    const allYears = sharks.flatMap(
        s => [parseInt(s.oldest), parseInt(s.newest)]
    ).filter(y => !isNaN(y));

    const minYear = allYears.length > 0 ? Math.min(...allYears) : 2000;
    const maxYear = allYears.length > 0 ? Math.max(...allYears) : 2024;

    const months = FULLMONTHS;

    // Memoize default criteria (combined shark and match filters)
    const defaultCriteria = useMemo(() => ({
        // Location & Time
        country: "",
        yearRange: [String(minYear), String(maxYear)],
        month: "",
        // Match Quality
        miewidDistanceRange: [0, 5.0],
        showOnlyConfidentMatches: false,
        hasMatchedImages: false,
        plausibility: "",
        // Keep these for filterSharks compatibility
        showOnlyWithMedia: false,
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
        setCriteria(defaultCriteria);
    };

    // Apply all filters (shark + match quality)
    const filteredSharks = useMemo(() => {
        // First apply standard shark filters
        const filteredBySharkCriteria = filterSharks(sharks, criteria);

        // Then apply match-specific filters
        return filteredBySharkCriteria.filter(shark => {
            // Filter by MIEWID distance range
            const distance = parseFloat(shark.miewid_distance);
            if (isNaN(distance)) return false;

            const [minDist, maxDist] = criteria.miewidDistanceRange;
            if (distance < minDist || distance > maxDist) return false;

            // Filter by confident matches checkbox
            if (criteria.showOnlyConfidentMatches && distance >= 1.0) {
                return false;
            }

            // Filter by plausibility
            if (criteria.plausibility && shark.plausibility !== criteria.plausibility) {
                return false;
            }

            // Filter by hasMatchedImages - check if matched shark has images in mediaMatches
            if (criteria.hasMatchedImages && mediaMatches) {
                // Extract the matched shark ID from the MIEWID column
                const miewidMatch = shark['MIEWID: closest_whale_shark_id (matched_image_id, distance)'];
                const matchedSharkId = miewidMatch?.match(/MIEWID:\s*([^(]+)/)?.[1]?.trim();
                
                if (matchedSharkId) {
                    const hasImages = mediaMatches.some(img => 
                        String(img.identificationID) === String(matchedSharkId)
                    );
                    // If filter is on and no images found, exclude this shark
                    if (!hasImages) return false;
                }
            }

            return true;
        });
    }, [sharks, criteria]);
    
    // Notify parent of filtered sharks changes
    useEffect(() => {
        if (onFilteredSharksChange) {
            onFilteredSharksChange(filteredSharks);
        }
    }, [filteredSharks, onFilteredSharksChange]);

    // Prepare filter options
    const filterOptions = {
        countries,
        publishingCountries,
        minYear,
        maxYear,
        months,
        minRecords,
        maxRecords
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
                            key={shark.identificationID}
                            className={`match-shark-item ${selectedSharkId === shark.identificationID ? 'selected' : ''}`}
                            onClick={() => onSharkSelect(shark.identificationID)}
                        >
                            <div className="match-shark-id">ID: {shark.whaleSharkID || 'N/A'}</div>
                            <div className="match-shark-meta">
                                {shark['country (year)'] || 'Unknown'} | {shark['Oldest Occurrence'] || 'N/A'}
                            </div>
                            {shark.miewid_distance && (
                                <div className={`match-distance ${parseFloat(shark.miewid_distance) < 1.0 ? 'good' : 'moderate'}`}>
                                    Distance: {shark.miewid_distance}
                                </div>
                            )}
                            {shark.plausibility && (
                                <div className={`match-plausibility plausibility-${shark.plausibility.toLowerCase()}`}>
                                    {shark.plausibility}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default MatchSharkSelector;
