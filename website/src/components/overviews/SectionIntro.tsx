import { useState } from "react";

import { SectionIntroProps } from "../../types/pages";

function SectionIntro({ tagline, body }: SectionIntroProps) {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    return (
        <div className="research-creative-intro">
            <p className="tagline">{tagline}</p>
            <p className={`intro-body ${isExpanded ? "expanded" : ""}`}>{body}</p>

            <button
                type="button"
                className="intro-toggle"
                aria-expanded={isExpanded}
                onClick={() => setIsExpanded((prev) => !prev)}
            >
                {isExpanded ? "Read less" : "Read more"}
            </button>
        </div>
    );
}

export default SectionIntro;
