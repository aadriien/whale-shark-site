import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import MatchFilter from "./MatchFilter";
import CollapsibleBody from "../controls/CollapsibleBody";
import CollapsibleToggle from "../controls/CollapsibleToggle";

import { filterVisionSharks, extractUniqueSortedRegions } from "../../utils/FilterSharks";
import { parseCriteria, mergeCriteriaParams } from "../../utils/UrlParamUtils";
import { FULLMONTHS } from "../../utils/DataUtils";

import { MatchSharkSelectorProps } from "../../types/panels";
import { SharkCriteria } from "../../types/filters";

function MatchSharkSelector({ sharks, onSharkSelect, selectedSharkId }: MatchSharkSelectorProps) {
    // Compute filter options from shark data
    const countries = extractUniqueSortedRegions(sharks, "countries");

    const allYears = sharks
        .flatMap((s) => [parseInt(s.oldest), parseInt(s.newest)])
        .filter((y) => !isNaN(y));

    const minYear = allYears.length > 0 ? Math.min(...allYears) : 2000;
    const maxYear = allYears.length > 0 ? Math.max(...allYears) : 2024;

    const months = FULLMONTHS;

    // Memoize default criteria (combined shark and match filters)
    const defaultCriteria: SharkCriteria = useMemo(
        () => ({
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
        }),
        [minYear, maxYear]
    );

    const [searchParams, setSearchParams] = useSearchParams();
    const [criteria, setCriteria] = useState<SharkCriteria>(() =>
        parseCriteria(searchParams, defaultCriteria)
    );
    const [showFilters, setShowFilters] = useState<boolean>(
        () => !window.matchMedia("(max-width: 900px)").matches
    );
    const [isListOpen, setIsListOpen] = useState<boolean>(!selectedSharkId);

    // Only 1 of the 2 folds open at a time on narrow screens
    const handleToggleList = () => {
        setIsListOpen((prev) => !prev);
        setShowFilters(false);
    };

    const handleToggleFilters = () => {
        setShowFilters((prev) => !prev);
        setIsListOpen(false);
    };

    const handleReset = () => {
        setCriteria(defaultCriteria);
    };

    // Apply all filters (shark + match quality)
    const filteredSharks = useMemo(() => {
        return filterVisionSharks(sharks, criteria);
    }, [sharks, criteria]);

    // Ensure filters are reflected as query params in URL
    useEffect(() => {
        setSearchParams((prev) => mergeCriteriaParams(prev, criteria, defaultCriteria));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [criteria]);

    // Prepare filter options
    const filterOptions = {
        countries,
        minYear,
        maxYear,
        months,
    };

    return (
        <div className="match-shark-selector">
            <div className="btn-row">
                <button
                    onClick={handleToggleFilters}
                    className="btn btn-primary"
                    aria-expanded={showFilters}
                >
                    {showFilters ? "Hide Filters ▲" : "Show Filters ▼"}
                </button>
                <button onClick={handleReset} className="btn btn-secondary">
                    Reset Filters
                </button>
                <CollapsibleToggle isOpen={isListOpen} accent="navy" onToggle={handleToggleList}>
                    {isListOpen ? "Hide Sharks ▲" : "Select a Shark ▼"}
                </CollapsibleToggle>
            </div>

            <div className="match-list-header">
                <span>
                    Showing {filteredSharks.length} of {sharks.length} sharks
                </span>
            </div>

            {showFilters && (
                <div className="match-filters-section">
                    <MatchFilter
                        criteria={criteria}
                        onChange={setCriteria}
                        options={filterOptions}
                    />
                </div>
            )}

            <CollapsibleBody isOpen={isListOpen} className="match-list-container">
                <div className="match-shark-list">
                    {filteredSharks.map((shark) => (
                        <div
                            key={shark.id}
                            className={`match-shark-item ${selectedSharkId === shark.id ? "selected" : ""}`}
                            onClick={() => {
                                onSharkSelect(shark.id);
                                setIsListOpen(false);
                            }}
                        >
                            <div className="match-shark-id">ID: {shark.id || "N/A"}</div>
                            <div className="match-shark-meta">
                                {shark.countries || "Unknown"} | {shark.oldest || "N/A"}
                            </div>
                            <div>
                                {shark.miewid_match_distance && (
                                    <span
                                        className={`match-distance-value ${shark.miewid_match_distance < 1.0 ? "good" : "moderate"}`}
                                    >
                                        {shark.miewid_match_distance}
                                    </span>
                                )}
                                {shark.plausibility && (
                                    <span
                                        className={`match-plausibility plausibility-${shark.plausibility.toLowerCase()}`}
                                    >
                                        {shark.plausibility}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CollapsibleBody>
        </div>
    );
}

export default MatchSharkSelector;
