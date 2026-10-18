import { CollapsibleToggleProps } from "../../types/controls";

function CollapsibleToggle({ isOpen, accent, onToggle, children }: CollapsibleToggleProps) {
    return (
        <button
            type="button"
            className="btn btn-primary collapsible-toggle"
            data-accent={accent}
            aria-expanded={isOpen}
            onClick={onToggle}
        >
            {children}
        </button>
    );
}

export default CollapsibleToggle;
