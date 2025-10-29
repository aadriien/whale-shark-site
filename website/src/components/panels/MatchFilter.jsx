// Match Quality Filter
function MatchQualityFilter({ criteria, onChange }) {
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
                <div className="filter-hint">
                    <small>0.0 = Perfect | 0.5-1.0 = Very similar | 1.0-2.0 = Moderate | 2.0+ = Different</small>
                </div>
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
        </fieldset>
    );
}


// Main MatchFilter component
function MatchFilter({ criteria, onChange, options }) {
    return (
        <div className="shark-filters scrollable-filters">
            <MatchQualityFilter criteria={criteria} onChange={onChange} />
        </div>
    );
}

export default MatchFilter;
