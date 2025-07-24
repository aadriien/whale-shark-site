import React, { useState } from "react";

import { 
    cleanLifestage, 
    extractContinents, 
    getCountryCode, 
    parseSpecificRegion, 
    parseRemarks, 
} from "../utils/DataUtils.js";


const VALID_CONTINENTS = new Set([
    "Africa",
    "Antarctica",
    "Asia",
    "Europe",
    "North America",
    "Oceania",
    "South America",
]);


// Helper to extract all regional options for filter (e.g. country, publishingCountry)
function extractUniqueSortedRegions(items, key) {
    return Array.from(
        new Set(
            items.flatMap(item =>
                item[key]
                    ?.split(",")
                    .map(c => parseSpecificRegion(c).trim())
                    .filter(Boolean) || []
            )
        )
    ).sort((a, b) => a.localeCompare(b));
};


function filterSharks(sharks, filters) {
    return sharks.filter((shark) => {
        // ---------- MEDIA PRESENCE ----------
        if (filters.showOnlyWithMedia) {
            const hasMedia = (
                shark.image && 
                shark.image.trim() !== "" && 
                shark.image !== "Unknown"
            );
            if (!hasMedia) return false;
        }

        // ---------- LOCATION ----------
        if (filters.country) {
            const countries = (shark.countries || "")
                .split(",")
                .map(c => parseSpecificRegion(c).toLowerCase().trim());

            const match = countries.some(
                c => c.includes(
                    filters.country.toLowerCase()
                )
            );
            if (!match) return false;
        }

        if (filters.publishingCountry) {
            const publishingCountries = (shark.publishing || "")
                .split(",")
                .map(c => parseSpecificRegion(c).toLowerCase().trim());

            const match = publishingCountries.some(
                c => c.includes(
                    filters.publishingCountry.toLowerCase()
                )
            );
            if (!match) return false;
        }

        // ---------- TIME RANGE ----------
        if (filters.yearRange) {
            const yearMin = parseInt(shark.oldest);
            const yearMax = parseInt(shark.newest);
            const filterMin = parseInt(filters.yearRange[0]);
            const filterMax = parseInt(filters.yearRange[1]);

            if (
                isNaN(yearMin) || isNaN(yearMax) ||
                yearMax < filterMin ||
                yearMin > filterMax
            ) {
                return false;
            }
        }

        // ---------- METADATA ----------
        if (filters.hasOccurrenceNotes) {
            const remarks = parseRemarks(shark.remarks);
            if (remarks === "None") return false;
        }

        if (filters.minRecords > 0 && shark.occurrences < filters.minRecords) {
            return false;
        }

        // ---------- TAXONOMIC & BIO ----------
        if (filters.sex) {
            const sex = shark.sex?.toLowerCase() || "";
            if (sex !== filters.sex.toLowerCase()) return false;
        }

        if (filters.lifeStage) {
            const stage = cleanLifestage(shark).toLowerCase();
            if (stage !== filters.lifeStage.toLowerCase()) return false;
        }

        if (filters.observationType) {
            let hasType = true;
            if (filters.observationType == "Satellite") {
                hasType = shark.machine > 0 ? true : false;
            }
            else if (filters.observationType == "Human") {
                hasType = shark.human > 0 ? true : false;
            }
            if (!hasType) return false;
        }

        // PASSES ALL FILTERS
        return true;
    });
}


// Media Filter
function renderMediaFilter({ filters, setFilters }) {
    return (
        <fieldset className="filter-group">
            <legend>Media</legend>
            <label className="filter-label">
                <input
                    type="checkbox"
                    checked={filters.showOnlyWithMedia}
                    onChange={() =>
                        setFilters((f) => ({
                            ...f,
                            showOnlyWithMedia: !f.showOnlyWithMedia,
                        }))
                    }
                />
                Sharks with real-world images
            </label>
        </fieldset>
    );
}

// Location Filters
function renderLocationFilters({ filters, setFilters, COUNTRIES, PUBLISHING_COUNTRIES }) {
    return (
        <fieldset className="filter-group">
            <legend>Location</legend>

            <label className="filter-label">
                Country:
                <select
                    value={filters.country}
                    onChange={(e) =>
                        setFilters((f) => ({ ...f, country: e.target.value }))
                    }
                    className="filter-select"
                >
                    <option value="">All</option>
                    {COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                            {country}
                        </option>
                    ))}
                </select>
            </label>

            <label className="filter-label">
                Publishing Country:
                <select
                    value={filters.publishingCountry}
                    onChange={(e) =>
                        setFilters((f) => ({ ...f, publishingCountry: e.target.value }))
                    }
                    className="filter-select"
                >
                    <option value="">All</option>
                    {PUBLISHING_COUNTRIES.map((publishing) => (
                        <option key={publishing} value={publishing}>
                            {publishing}
                        </option>
                    ))}
                </select>
            </label>
        </fieldset>
    );
}

// Time Filter
function renderTimeFilter({ filters, setFilters, MIN_YEAR, MAX_YEAR }) {
    return (
        <fieldset className="filter-group">
            <legend>Time</legend>

            <label className="filter-label">
                Year Range:
                <div className="range-inputs">
                    <input
                        type="number"
                        value={filters.yearRange[0]}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFilters((f) => ({ ...f, yearRange: [val, f.yearRange[1]] }));
                        }}
                        // Validate int min bounds on click away
                        onBlur={() => {
                            setFilters((f) => {
                                const num = parseInt(f.yearRange[0]);
                                const safe = isNaN(num)
                                    ? MIN_YEAR
                                    : Math.max(
                                        MIN_YEAR,
                                        Math.min(num, parseInt(f.yearRange[1]))
                                    );
                                return { ...f, yearRange: [String(safe), f.yearRange[1]] };
                            });
                        }}
                        className="filter-input"
                    />
                    <span style={{ margin: "0 0.25rem" }}>to</span>
                    <input
                        type="number"
                        value={filters.yearRange[1]}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFilters((f) => ({ ...f, yearRange: [f.yearRange[0], val] }));
                        }}
                        // Validate int max bounds on click away
                        onBlur={() => {
                            setFilters((f) => {
                                const num = parseInt(f.yearRange[1]);
                                const safe = isNaN(num)
                                    ? MAX_YEAR
                                    : Math.min(
                                        MAX_YEAR,
                                        Math.max(num, parseInt(f.yearRange[0]))
                                    );
                                return { ...f, yearRange: [f.yearRange[0], String(safe)] };
                            });
                        }}
                        className="filter-input"
                    />
                </div>
            </label>
        </fieldset>
    );
}

// Metadata Filters
function renderMetadataFilters({ filters, setFilters, MIN_RECORDS, MAX_RECORDS }) {
    return (
        <fieldset className="filter-group">
            <legend>Metadata</legend>

            <label className="filter-label">
                <input
                    type="checkbox"
                    checked={filters.hasOccurrenceNotes}
                    onChange={() =>
                        setFilters((f) => ({ ...f, hasOccurrenceNotes: !f.hasOccurrenceNotes }))
                    }
                />
                Sharks with occurrence notes
            </label>

            <label className="filter-label">
                Min Records:
                <input
                    type="number"
                    min={MIN_RECORDS}
                    max={MAX_RECORDS}
                    value={filters.minRecords}
                    onChange={(e) => {
                        const val = e.target.value;
                        setFilters((f) => ({ ...f, minRecords: val }));
                    }}
                    // Validate min records bounds on click away
                    onBlur={() => {
                        setFilters((f) => {
                            const num = parseInt(f.minRecords, 10);
                            if (isNaN(num))
                                return {
                                    ...f,
                                    minRecords: MIN_RECORDS,
                                };
                            const clamped = Math.max(
                                MIN_RECORDS,
                                Math.min(num, MAX_RECORDS)
                            );
                            return { ...f, minRecords: clamped };
                        });
                    }}
                    className="filter-input"
                />
            </label>
        </fieldset>
    );
}

// Biological Filters
function renderBiologicalFilters({ filters, setFilters }) {
    return (
        <fieldset className="filter-group">
            <legend>Biological</legend>

            <label className="filter-label">
                Sex:
                <select
                    value={filters.sex}
                    onChange={(e) => setFilters((f) => ({ ...f, sex: e.target.value }))}
                    className="filter-select"
                >
                    <option value="">All</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Unknown">Unknown</option>
                </select>
            </label>

            <label className="filter-label">
                Life Stage:
                <select
                    value={filters.lifeStage}
                    onChange={(e) => setFilters((f) => ({ ...f, lifeStage: e.target.value }))}
                    className="filter-select"
                >
                    <option value="">All</option>
                    <option value="Juvenile">Juvenile</option>
                    <option value="Subadult">Subadult</option>
                    <option value="Adult">Adult</option>
                    <option value="Unknown">Unknown</option>
                </select>
            </label>

            <label className="filter-label">
                Observation Type:
                <select
                    value={filters.observationType}
                    onChange={(e) =>
                        setFilters((f) => ({ ...f, observationType: e.target.value }))
                    }
                    className="filter-select"
                >
                    <option value="">All</option>
                    <option value="Satellite">Satellite Tracking</option>
                    <option value="Human">Human Sightings</option>
                </select>
            </label>
        </fieldset>
    );
}

// Main assembly function for SQL-style filters
function renderAllFilters({
    filters,
    setFilters,
    COUNTRIES,
    PUBLISHING_COUNTRIES,
    MIN_YEAR,
    MAX_YEAR,
    MIN_RECORDS,
    MAX_RECORDS
}) {
    return (
        <div className="shark-filters scrollable-filters">
            {renderMediaFilter({ filters, setFilters })}

            {renderLocationFilters({ filters, setFilters, COUNTRIES, PUBLISHING_COUNTRIES })}

            {renderTimeFilter({ filters, setFilters, MIN_YEAR, MAX_YEAR })}

            {renderMetadataFilters({ filters, setFilters, MIN_RECORDS, MAX_RECORDS })}

            {renderBiologicalFilters({ filters, setFilters })}
        </div>
    );
}


function SharkSelector({ sharks, onReset, onSelect, selectedSharkId }) {
    // Populate & constrain filter dropdown options
    const COUNTRIES = extractUniqueSortedRegions(sharks, "countries");
    const PUBLISHING_COUNTRIES = extractUniqueSortedRegions(sharks, "publishing");

    const MIN_RECORDS = Math.min(...sharks.map(s => s.occurrences || 1));
    const MAX_RECORDS = Math.max(...sharks.map(s => s.occurrences || 1));

    const ALL_YEARS = sharks.flatMap(
        s => [parseInt(s.oldest), parseInt(s.newest)]
    ).filter(y => !isNaN(y));
    const MIN_YEAR = Math.min(...ALL_YEARS);
    const MAX_YEAR = Math.max(...ALL_YEARS);


    const defaultFilters = {
        showOnlyWithMedia: false,
        country: "",
        yearRange: [String(MIN_YEAR), String(MAX_YEAR)],
        hasOccurrenceNotes: false,
        minRecords: 1,
        sex: "",
        lifeStage: "",  
        publishingCountry: "", 
        observationType: "", 
    };
    const [filters, setFilters] = React.useState(defaultFilters);
    const [showFilters, setShowFilters] = useState(true);

    const handleReset = () => {
        setFilters(defaultFilters);
        if (onReset) onReset(); // float back up to parent's reset
    };

    // Track which continents are expanded & group sharks by continent
    const [openContinents, setOpenContinents] = useState({});


    const filteredSharks = React.useMemo(
        () => filterSharks(sharks, filters), [sharks, filters]
    );

    const sharksByContinent = React.useMemo(() => {
        const byContinent = {};
        
        filteredSharks.forEach(shark => {
            const continents = extractContinents(shark.continent);
            
            continents.forEach(continent => {
                if (VALID_CONTINENTS.has(continent)) {
                    if (!byContinent[continent]) {
                        byContinent[continent] = [];
                    }
                    byContinent[continent].push(shark);
                }
            });
        });
        return byContinent;
    }, [filteredSharks]);

    const toggleContinent = (continent) => {
        setOpenContinents(prev => ({
            ...prev,
            [continent]: !prev[continent],
        }));
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }} >
            <div className="shark-selector-list">
                <button 
                    onClick={handleReset}
                    className={`show-all-button ${selectedSharkId == null ? "active" : ""}`}
                >
                    Reset All Sharks
                </button>

                <div className="filter-toggle-container">
                    <button 
                        onClick={() => setShowFilters((prev) => !prev)}
                        className={`toggle-filter-button ${showFilters ? "active" : ""}`}
                    >
                        {showFilters ? "Hide Filters ▲" : "Show Filters ▼"}
                    </button>

                    {showFilters && renderAllFilters({
                        filters,
                        setFilters,
                        COUNTRIES,
                        PUBLISHING_COUNTRIES,
                        MIN_YEAR,
                        MAX_YEAR,
                        MIN_RECORDS,
                        MAX_RECORDS,
                    })}
                </div>

                <div className="scrollable-sharks-list">
                    {Object.keys(sharksByContinent).length === 0 ? (
                        <div className="no-sharks-message">
                            Sorry! No whale sharks match your current filters.
                        </div>
                    ) : (
                    Object.entries(sharksByContinent)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([continent, sharks]) => {
                        const isOpen = openContinents[continent];
                        
                        return (  
                            <div key={continent} className="continent-dropdown">
                                <div
                                    className="continent-header"
                                    onClick={() => toggleContinent(continent)}
                                >
                                    {continent} {isOpen ? "▾" : "▸"}
                                </div>
                                {isOpen && (
                                    <div className="continent-shark-list">
                                        {sharks.map((shark) => (
                                            <div
                                                key={shark.id}
                                                className={`shark-selector-item ${shark.id === selectedSharkId ? "selected" : ""}`}
                                                onClick={() => onSelect(shark.id)}
                                            >
                                                {(() => {
                                                    const countryName = parseSpecificRegion(shark.countries.trim());
                                                    const code = getCountryCode(countryName);

                                                    return (
                                                        <>
                                                        {code ? (
                                                            <div className="flag-and-code">
                                                                <img
                                                                    src={`https://flagcdn.com/24x18/${code}.png`}
                                                                    alt={countryName}
                                                                    title={countryName}
                                                                    className="flag-icon"
                                                                    loading="lazy"
                                                                />
                                                                <span className="country-code">{code.toUpperCase()}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="flag-and-code" title={countryName} role="img" aria-label="unknown country">
                                                                🌍 <span className="country-code">N/A</span>
                                                            </span>
                                                        )}
                                                        {shark.id}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                    )}
                </div>
            </div>
        </div>
    );
}

export default SharkSelector;
