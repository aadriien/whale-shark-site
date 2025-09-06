import { useMemo } from "react";


const DataMetricFilter = ({ label, field, data, selectedValue, onChange, inline }) => {
    const options = useMemo(() => {
        const uniqueValues = Array.from(new Set(data.map(d => d[field])));

        return uniqueValues.sort((a, b) => {
            if (typeof a === "number" && typeof b === "number") return b - a;
            return String(a).localeCompare(String(b));
        });
    }, [data, field]);

    const placeholder = `-- Choose a ${label.toUpperCase()} --`;

    return (
        <div className={inline ? "data-metric-filter-inline" : "data-metric-filter"}>
            {!inline && (
                <label htmlFor={`${field}-select`} className="data-metric-filter-label">
                    Select a {label.toUpperCase()}:
                </label>
            )}

            <select
                id={`${field}-select`}
                value={selectedValue}
                onChange={(e) => onChange(e.target.value)}
                className="data-metric-filter-select"
            >
                <option value="">{placeholder}</option>
                
                {options.map((val) => (
                    <option key={val} value={val}>
                        {val}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default DataMetricFilter;
