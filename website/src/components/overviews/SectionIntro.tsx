import { useState } from "react";

import ReadMoreToggle from "../controls/ReadMoreToggle";
import { SectionIntroProps } from "../../types/pages";

function SectionIntro({ tagline, body }: SectionIntroProps) {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    return (
        <div className="research-creative-intro">
            <p className="tagline">{tagline}</p>
            <p className={`intro-body ${isExpanded ? "expanded" : ""}`}>{body}</p>

            <ReadMoreToggle
                expanded={isExpanded}
                onToggle={() => setIsExpanded((prev) => !prev)}
            />
        </div>
    );
}

export default SectionIntro;
