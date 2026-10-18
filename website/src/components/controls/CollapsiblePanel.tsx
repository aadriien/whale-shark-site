import { useState } from "react";

import CollapsibleBody from "./CollapsibleBody";
import CollapsibleToggle from "./CollapsibleToggle";
import { CollapsiblePanelProps } from "../../types/controls";

function CollapsiblePanel({ label, ...bodyProps }: CollapsiblePanelProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    return (
        <>
            <CollapsibleToggle isOpen={isOpen} onToggle={() => setIsOpen((prev) => !prev)}>
                {label(isOpen)}
            </CollapsibleToggle>

            <CollapsibleBody isOpen={isOpen} {...bodyProps} />
        </>
    );
}

export default CollapsiblePanel;
