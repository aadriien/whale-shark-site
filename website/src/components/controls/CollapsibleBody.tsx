import { CollapsibleBodyProps } from "../../types/controls";

// Wide screens always show content, while narrow screens fold it until its toggle opens it
function CollapsibleBody({ isOpen, className = "", children }: CollapsibleBodyProps) {
    return (
        <div className={`collapsible-body ${className} ${isOpen ? "open" : ""}`}>{children}</div>
    );
}

export default CollapsibleBody;
