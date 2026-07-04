import { GraphDistanceRangeProps } from "../../types/controls";

function GraphDistanceRange({ label, step, value, onChange }: GraphDistanceRangeProps) {
    const [min, max] = value;

    return (
        <label className="graph-distance-range">
            {label}
            <input
                type="number"
                step={step}
                min="0"
                max={max}
                value={min}
                onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) onChange([val, max]);
                }}
                className="graph-range-input"
            />
            <span>to</span>
            <input
                type="number"
                step={step}
                min={min}
                value={max}
                onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) onChange([min, val]);
                }}
                className="graph-range-input"
            />
        </label>
    );
}

export default GraphDistanceRange;