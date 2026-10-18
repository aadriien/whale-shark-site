import { useEffect } from "react";
import { createPortal } from "react-dom";

import { LightboxOverlayProps } from "../../types/controls";

// Shared backdrop for every lightbox. Rendered in document.body so no ancestor
// (e.g. a bottom sheet with overflow & rounded corners) can clip or restack it
function LightboxOverlay({ onClose, contentClassName, children }: LightboxOverlayProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return createPortal(
        <div className="image-overlay" onClick={onClose}>
            <div className={contentClassName} onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>,
        document.body
    );
}

export default LightboxOverlay;
