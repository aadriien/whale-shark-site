import { 
    BaseFilterProps, 
    LocationFilterProps, 
    TimeFilterProps, 
    SharkFilterProps 
} from "../../types/filters";


// Location Filters
function LocationFilters({ criteria, onChange, countries }: LocationFilterProps) {
    return (
        <fieldset className="filter-group">
            <legend>Location</legend>

            <label className="filter-label">
                Country:
                <select
                    value={criteria.country}
                    onChange={(e) =>
                        onChange({ ...criteria, country: e.target.value })
                    }
                    className="filter-select"
                >
                    <option value="">All</option>
                    {countries.map((country) => (
                        <option key={country} value={country}>
                            {country}
                        </option>
                    ))}
                </select>
            </label>
        </fieldset>
    );
}


// Time Filter
function TimeFilter({ 
    criteria, onChange, 
    minYear, maxYear, months 
}: TimeFilterProps) {
    return (
        <fieldset className="filter-group">
            <legend>Time</legend>

            <label className="filter-label">
                Year Range:
                <div className="range-inputs">
                    <input
                        type="number"
                        value={criteria.yearRange[0]}
                        onChange={(e) => {
                            const val = e.target.value;
                            onChange({ ...criteria, yearRange: [val, criteria.yearRange[1]] });
                        }}
                        onBlur={() => {
                            const num = parseInt(criteria.yearRange[0]);
                            const safe = isNaN(num)
                                ? minYear
                                : Math.max(
                                    minYear,
                                    Math.min(num, parseInt(criteria.yearRange[1]))
                                );
                            onChange({ ...criteria, yearRange: [String(safe), criteria.yearRange[1]] });
                        }}
                        className="filter-input"
                    />
                    <span style={{ margin: "0 0.25rem" }}>to</span>
                    <input
                        type="number"
                        value={criteria.yearRange[1]}
                        onChange={(e) => {
                            const val = e.target.value;
                            onChange({ ...criteria, yearRange: [criteria.yearRange[0], val] });
                        }}
                        onBlur={() => {
                            const num = parseInt(criteria.yearRange[1]);
                            const safe = isNaN(num)
                                ? maxYear
                                : Math.min(
                                    maxYear,
                                    Math.max(num, parseInt(criteria.yearRange[0]))
                                );
                            onChange({ ...criteria, yearRange: [criteria.yearRange[0], String(safe)] });
                        }}
                        className="filter-input"
                    />
                </div>
            </label>

            <label className="filter-label">
                Month:
                <select
                    value={criteria.month}
                    onChange={(e) =>
                        onChange({ ...criteria, month: e.target.value })
                    }
                    className="filter-select"
                >
                    <option value="">All</option>
                    {months.map((month) => (
                        <option key={month} value={month}>
                            {month}
                        </option>
                    ))}
                </select>
            </label>
        </fieldset>
    );
}


// Match Quality Filter
function MatchQualityFilter({ criteria, onChange }: BaseFilterProps) {
    return (
        <fieldset className="filter-group">
            <legend>Match Quality</legend>

            <label className="filter-label">
                MIEWID Distance Range:
                <div className="range-inputs">
                    <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={criteria.miewidDistanceRange[0]}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChange({ 
                                ...criteria, 
                                miewidDistanceRange: [val, criteria.miewidDistanceRange[1]] 
                            });
                        }}
                        className="filter-input"
                    />
                    <span style={{ margin: "0 0.25rem" }}>to</span>
                    <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={criteria.miewidDistanceRange[1]}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChange({ 
                                ...criteria, 
                                miewidDistanceRange: [criteria.miewidDistanceRange[0], val] 
                            });
                        }}
                        className="filter-input"
                    />
                </div>
                <div className="match-filter-hint">
                    <small>0.0 = Perfect | 0.5-1.0 = Very similar | 1.0-2.0 = Moderate | 2.0+ = Different</small>
                </div>
            </label>

            <label className="filter-label">
                Plausibility:
                <select
                    value={criteria.plausibility || ""}
                    onChange={(e) =>
                        onChange({ ...criteria, plausibility: e.target.value })
                    }
                    className="filter-select"
                >
                    <option value="">All</option>
                    <option value="PLAUSIBLE">Plausible</option>
                    <option value="UNCERTAIN">Uncertain</option>
                    <option value="IMPOSSIBLE">Impossible</option>
                    <option value="UNKNOWN">Unknown</option>
                </select>
            </label>

            <label className="filter-label">
                <input
                    type="checkbox"
                    checked={criteria.showOnlyConfidentMatches}
                    onChange={() =>
                        onChange({
                            ...criteria,
                            showOnlyConfidentMatches: !criteria.showOnlyConfidentMatches,
                        })
                    }
                />
                Show only confident matches (distance &lt; 1.0)
            </label>

            <label className="filter-label">
                <input
                    type="checkbox"
                    checked={criteria.hasMatchedImages}
                    onChange={() =>
                        onChange({
                            ...criteria,
                            hasMatchedImages: !criteria.hasMatchedImages,
                        })
                    }
                />
                Matched shark has images
            </label>
        </fieldset>
    );
}


// Main MatchFilter component - combines all filters
function MatchFilter({ criteria, onChange, options }: SharkFilterProps) {
    const {
        countries = [],
        minYear = 2000,
        maxYear = 2024,
        months = [],
    } = options;

    return (
        <div className="match-filters-all">
            <LocationFilters 
                criteria={criteria} 
                onChange={onChange} 
                countries={countries}
            />
            
            <TimeFilter 
                criteria={criteria} 
                onChange={onChange} 
                minYear={minYear}
                maxYear={maxYear}
                months={months}
            />

            <MatchQualityFilter criteria={criteria} onChange={onChange} />
        </div>
    );
}

export default MatchFilter;
