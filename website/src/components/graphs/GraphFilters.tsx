import CollapsiblePanel from "../controls/CollapsiblePanel";

import { GraphFiltersProps } from "../../types/graphs";

function GraphFilters({ activeCount, children }: GraphFiltersProps) {
    return (
        <CollapsiblePanel
            className="graph-controls"
            label={(isOpen) => (
                <>
                    {isOpen ? "Hide Filters ▲" : "Show Filters ▼"}
                    <span className="count-label"> ({activeCount})</span>
                </>
            )}
        >
            {children}
        </CollapsiblePanel>
    );
}

export default GraphFilters;
