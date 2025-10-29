// Location Filters
function LocationFilters({ criteria, onChange, countries }) {
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
function TimeFilter({ criteria, onChange, minYear, maxYear, months }) {
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


// Main filter component (only location and time)
function MatchLocationTimeFilter({ criteria, onChange, options }) {
    const {
        countries = [],
        minYear = 2000,
        maxYear = 2024,
        months = [],
    } = options;

    return (
        <div className="shark-filters scrollable-filters">
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
        </div>
    );
}

export default MatchLocationTimeFilter;
