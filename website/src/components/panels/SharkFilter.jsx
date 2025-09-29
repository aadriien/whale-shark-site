// Media Filter
function MediaFilter({ criteria, onChange }) {
    return (
        <fieldset className="filter-group">
            <legend>Media</legend>
            <label className="filter-label">
                <input
                    type="checkbox"
                    checked={criteria.showOnlyWithMedia}
                    onChange={() =>
                        onChange({
                            ...criteria,
                            showOnlyWithMedia: !criteria.showOnlyWithMedia,
                        })
                    }
                />
                Sharks with real-world images
            </label>
        </fieldset>
    );
}


// Location Filters
function LocationFilters({ criteria, onChange, countries, publishingCountries }) {
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

            <label className="filter-label">
                Publishing Country:
                <select
                    value={criteria.publishingCountry}
                    onChange={(e) =>
                        onChange({ ...criteria, publishingCountry: e.target.value })
                    }
                    className="filter-select"
                >
                    <option value="">All</option>
                    {publishingCountries.map((publishing) => (
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
                        // Validate int min bounds on click away
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
                        // Validate int max bounds on click away
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


// Metadata Filters
function MetadataFilters({ criteria, onChange, minRecords, maxRecords }) {
    return (
        <fieldset className="filter-group">
            <legend>Metadata</legend>

            <label className="filter-label">
                <input
                    type="checkbox"
                    checked={criteria.hasOccurrenceNotes}
                    onChange={() =>
                        onChange({ ...criteria, hasOccurrenceNotes: !criteria.hasOccurrenceNotes })
                    }
                />
                Sharks with occurrence notes
            </label>

            <label className="filter-label">
                Min Records:
                <input
                    type="number"
                    min={minRecords}
                    max={maxRecords}
                    value={criteria.minRecords}
                    onChange={(e) => {
                        const val = e.target.value;
                        onChange({ ...criteria, minRecords: val });
                    }}
                    // Validate min records bounds on click away
                    onBlur={() => {
                        const num = parseInt(criteria.minRecords, 10);
                        if (isNaN(num)) {
                            onChange({ ...criteria, minRecords: minRecords });
                            return;
                        }
                        const clamped = Math.max(
                            minRecords,
                            Math.min(num, maxRecords)
                        );
                        onChange({ ...criteria, minRecords: clamped });
                    }}
                    className="filter-input"
                />
            </label>
        </fieldset>
    );
}


// Biological Filters
function BiologicalFilters({ criteria, onChange }) {
    return (
        <fieldset className="filter-group">
            <legend>Biological</legend>

            <label className="filter-label">
                Sex:
                <select
                    value={criteria.sex}
                    onChange={(e) => onChange({ ...criteria, sex: e.target.value })}
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
                    value={criteria.lifeStage}
                    onChange={(e) => onChange({ ...criteria, lifeStage: e.target.value })}
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
                    value={criteria.observationType}
                    onChange={(e) =>
                        onChange({ ...criteria, observationType: e.target.value })
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


// Main SharkFilter component (purely controlled)
function SharkFilter({ criteria, onChange, options }) {
    const {
        countries = [],
        publishingCountries = [],
        minYear = 2000,
        maxYear = 2024,
        months = [],
        minRecords = 1,
        maxRecords = 100
    } = options;

    return (
        <div className="shark-filters scrollable-filters">
            <MediaFilter criteria={criteria} onChange={onChange} />
            
            <LocationFilters 
                criteria={criteria} 
                onChange={onChange} 
                countries={countries}
                publishingCountries={publishingCountries}
            />
            
            <TimeFilter 
                criteria={criteria} 
                onChange={onChange} 
                minYear={minYear}
                maxYear={maxYear}
                months={months}
            />
            
            <MetadataFilters 
                criteria={criteria} 
                onChange={onChange} 
                minRecords={minRecords}
                maxRecords={maxRecords}
            />
            
            <BiologicalFilters criteria={criteria} onChange={onChange} />
        </div>
    );
}

export default SharkFilter;

