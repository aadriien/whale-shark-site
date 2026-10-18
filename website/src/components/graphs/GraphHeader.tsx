import { useState } from "react";

import ReadMoreToggle from "../controls/ReadMoreToggle";
import { GraphHeaderProps } from "../../types/graphs";

// Each side holds one graph's title & blurb, so clicking switches to that graph
function GraphHeader({ options, activeId, onChange }: GraphHeaderProps) {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const activeOption = options.find(({ id }) => id === activeId);

    return (
        <>
            <div className="graph-header" role="tablist">
                {options.map(({ id, title, shortTitle, description }) => (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={id === activeId}
                        className={`graph-header-option ${id === activeId ? "active" : ""}`}
                        onClick={() => onChange(id)}
                    >
                        <span className="graph-header-title">{title}</span>
                        <span className="graph-header-title-short">{shortTitle}</span>
                        <span className="graph-header-blurb">{description}</span>
                    </button>
                ))}
            </div>

            {/* Only shown on narrow screens, where blurbs fold into 1 card for active graph */}
            <div className={`graph-header-more ${isExpanded ? "expanded" : ""}`}>
                <p className="graph-header-tagline">{activeOption?.tagline}</p>
                <p className="graph-header-more-body">{activeOption?.description}</p>
                <ReadMoreToggle
                    expanded={isExpanded}
                    onToggle={() => setIsExpanded((prev) => !prev)}
                />
            </div>
        </>
    );
}

export default GraphHeader;
