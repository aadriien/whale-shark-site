import { ReadMoreToggleProps } from "../../types/controls";

function ReadMoreToggle({ expanded, onToggle }: ReadMoreToggleProps) {
    return (
        <button
            type="button"
            className="read-more-toggle"
            aria-expanded={expanded}
            onClick={onToggle}
        >
            {expanded ? "Read less" : "Read more"}
        </button>
    );
}

export default ReadMoreToggle;
