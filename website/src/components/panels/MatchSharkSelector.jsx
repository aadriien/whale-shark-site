import { useState, useEffect, useMemo } from "react";

import MatchLocationTimeFilter from "./MatchLocationTimeFilter.jsx";
import MatchFilter from "./MatchFilter.jsx";

import { filterSharks, extractUniqueSortedRegions } from "../../utils/FilterSharks.jsx";
import { FULLMONTHS } from "../../utils/DataUtils.js";


function MatchSharkSelector({ 
    sharks, 
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

    // Memoize default criteria
    const defaultSharkCriteria = useMemo(() => ({
        showOnlyWithMedia: false,
        country: "",
        yearRange: [String(minYear), String(maxYear)],
        month: "",
        hasOccurrenceNotes: false,
        minRecords: 1,
        sex: "",
        lifeStage: "",  
        publishingCountry: "", 
        observationType: "", 
    }), [minYear, maxYear]);

    const defaultMatchCriteria = useMemo(() => ({
        miewidDistanceRange: [0, 5.0],
        showOnlyConfidentMatches: false,
    }), []);
    
    const [sharkCriteria, setSharkCriteria] = useState(defaultSharkCriteria);
    const [matchCriteria, setMatchCriteria] = useState(defaultMatchCriteria);
    const [showFilters, setShowFilters] = useState(true);

    const handleReset = () => {
        setSharkCriteria(defaultSharkCriteria);
        setMatchCriteria(defaultMatchCriteria);
    };

    // Apply shark filters
    const filteredBySharkCriteria = useMemo(() => {
        return filterSharks(sharks, sharkCriteria);
    }, [sharks, sharkCriteria]);

    // Apply match quality filters
    const filteredSharks = useMemo(() => {
        return filteredBySharkCriteria.filter(shark => {
            // Filter by MIEWID distance range
            const distance = parseFloat(shark.miewid_distance);
            if (isNaN(distance)) return false;

            const [minDist, maxDist] = matchCriteria.miewidDistanceRange;
            if (distance < minDist || distance > maxDist) return false;

            // Filter by confident matches checkbox
            if (matchCriteria.showOnlyConfidentMatches && distance >= 1.0) {
                return false;
            }

            return true;
        });
    }, [filteredBySharkCriteria, matchCriteria]);
    
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
            <div className="selector-header">
                <h3>Shark Selection</h3>
                <button 
                    onClick={handleReset}
                    className="match-reset-filters-button"
                >
                    Reset Filters
                </button>
            </div>

            <div className="filter-toggle-container">
                <button 
                    onClick={() => setShowFilters((prev) => !prev)}
                    className={`match-toggle-filter-button ${showFilters ? "active" : ""}`}
                >
                    {showFilters ? "Hide Filters ▲" : "Show Filters ▼"}
                </button>

                {showFilters && (
                    <div className="match-filters-container">
                        <div className="match-filter-columns">
                            <div className="match-filter-column">
                                <h4>Location & Time</h4>
                                <MatchLocationTimeFilter 
                                    criteria={sharkCriteria} 
                                    onChange={setSharkCriteria} 
                                    options={filterOptions}
                                />
                            </div>

                            <div className="match-filter-column">
                                <h4>Match Quality</h4>
                                <MatchFilter 
                                    criteria={matchCriteria} 
                                    onChange={setMatchCriteria} 
                                    options={{}}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="shark-list-container">
                <div className="shark-list-header">
                    <span>Showing {filteredSharks.length} of {sharks.length} sharks</span>
                </div>
                <div className="shark-list">
                    {filteredSharks.map((shark) => (
                        <div
                            key={shark.identificationID}
                            className={`shark-item ${selectedSharkId === shark.identificationID ? 'selected' : ''}`}
                            onClick={() => onSharkSelect(shark.identificationID)}
                        >
                            <div className="shark-id">ID: {shark.whaleSharkID || 'N/A'}</div>
                            <div className="shark-meta">
                                {shark['country (year)'] || 'Unknown'} | {shark['Oldest Occurrence'] || 'N/A'}
                            </div>
                            {shark.miewid_distance && (
                                <div className={`match-distance ${parseFloat(shark.miewid_distance) < 1.0 ? 'good' : 'moderate'}`}>
                                    Distance: {shark.miewid_distance}
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
