import { useMemo } from "react";


const DataMetricFilter = ({ label, field, data, selectedValue, onChange }) => {
    const options = useMemo(() => {
        const uniqueValues = Array.from(new Set(data.map(d => d[field])));
        
        // Sort numeric descending or string ascending
        return uniqueValues.sort((a, b) => {
            if (typeof a === "number" && typeof b === "number") return b - a;
            return String(a).localeCompare(String(b));
        });
    }, [data, field]);

    return (
        <div style={{ marginBottom: "1rem" }}>
            <label htmlFor={`${field}-select`} style={{ fontWeight: "bold" }}>
                Select a {label.toLowerCase()}:
            </label>
            <select
                id={`${field}-select`}
                value={selectedValue}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="">-- Choose a {label.toLowerCase()} --</option>
                {options.map((val) => (
                    <option key={val} value={val}>{val}</option>
                ))}
            </select>
        </div>
    );
};

export default DataMetricFilter;
