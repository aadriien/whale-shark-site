import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import SharkFilter from "./SharkFilter";
import FilterChips from "./FilterChips";

import { filterSharks, extractUniqueSortedRegions } from "../../utils/FilterSharks";
import { parseCriteria, criteriaToParams, mergeCriteriaParams } from "../../utils/UrlParamUtils";
import { FULLMONTHS } from "../../utils/DataUtils";

import { SharkFilterOptions, SharkBaseCriteria } from "../../types/filters";
import { SharkSelectorProps } from "../../types/panels";

function SharkSelector({
    sharks,
    onReset,
    onDeselect,
    onSelect,
    selectedSharkId,
    DisplayComponent,
    disabled = false,
    onFilteredSharksChange,
}: SharkSelectorProps) {
    // Compute filter options from data
    const countries = extractUniqueSortedRegions(sharks, "countries");
    const publishingCountries = extractUniqueSortedRegions(sharks, "publishing");

    const minRecords = Math.min(...sharks.map((s) => s.occurrences || 1));
    const maxRecords = Math.max(...sharks.map((s) => s.occurrences || 1));

    const allYears = sharks
        .flatMap((s) => [parseInt(s.oldest), parseInt(s.newest)])
        .filter((y) => !isNaN(y));

    const minYear = Math.min(...allYears);
    const maxYear = Math.max(...allYears);

    const months = FULLMONTHS;

    // Memoize default criteria to prevent unnecessary re-initializations
    const defaultCriteria: SharkBaseCriteria = useMemo(
        () => ({
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
        }),
        [minYear, maxYear]
    );

    const [searchParams, setSearchParams] = useSearchParams();
    const [criteria, setCriteria] = useState<SharkBaseCriteria>(() =>
        parseCriteria(searchParams, defaultCriteria)
    );
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

    const activeFilterCount = useMemo(
        () => Array.from(criteriaToParams(criteria, defaultCriteria).keys()).length,
        [criteria, defaultCriteria]
    );

    // If landed with filters already in URL (shared link), then expand.
    // Fixed at mount, so later filter tweaks never trigger auto-expand
    const [autoExpandContinents] = useState<boolean>(activeFilterCount > 0);

    // Notify parent of filtered sharks changes
    useEffect(() => {
        if (onFilteredSharksChange) {
            onFilteredSharksChange(filteredSharks);
        }
    }, [filteredSharks, onFilteredSharksChange]);

    // Ensure filters are reflected as query params in URL
    useEffect(() => {
        setSearchParams((prev) => mergeCriteriaParams(prev, criteria, defaultCriteria));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [criteria]);

    // Prepare filter options for SharkFilter component
    const filterOptions: SharkFilterOptions = {
        countries,
        publishingCountries,
        minYear,
        maxYear,
        months,
        minRecords,
        maxRecords,
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                opacity: disabled ? 0.6 : 1,
                pointerEvents: disabled ? "none" : "auto",
            }}
        >
            <div className="shark-selector-list">
                <div className="filter-buttons">
                    <button
                        onClick={() => setShowFilters((prev) => !prev)}
                        className={`toggle-filter-button ${showFilters ? "active" : ""}`}
                        disabled={disabled}
                    >
                        {showFilters ? "Hide Filters" : "Show Filters"}
                        <span className="count-label">({activeFilterCount})</span>
                    </button>

                    <button
                        onClick={handleReset}
                        className="reset-filters-button"
                        disabled={disabled}
                    >
                        Reset Filters
                    </button>
                </div>

                <div className="filter-toggle-container">
                    <FilterChips
                        criteria={criteria}
                        defaults={defaultCriteria}
                        onChange={setCriteria}
                        selectedSharkId={selectedSharkId}
                        onDeselect={onDeselect}
                    />

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
                    selectedSharkId={selectedSharkId ?? ""}
                    autoExpand={autoExpandContinents}
                />
            </div>
        </div>
    );
}

export default SharkSelector;
