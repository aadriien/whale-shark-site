import { useState } from "react";

import { GraphFiltersProps } from "../../types/graphs";

function GraphFilters({ activeCount, children }: GraphFiltersProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    return (
        <>
            {/* Only shown on narrow screens, where filters fold behind it */}
            <button
                type="button"
                className="btn btn-primary graph-filters-toggle"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((prev) => !prev)}
            >
                {isOpen ? "Hide Filters ▲" : "Show Filters ▼"}
                <span className="count-label"> ({activeCount})</span>
            </button>

            <div className={`graph-controls ${isOpen ? "open" : ""}`}>{children}</div>
        </>
    );
}

export default GraphFilters;
