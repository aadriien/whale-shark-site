import { useEffect } from "react";

import MatchSharkBox from "../../cards/MatchSharkBox";
import { LightboxPanelData } from "../../../types/graphs";

type MatchImageLightboxProps = {
    isOpen: boolean;
    onClose: () => void;
    left: LightboxPanelData | null;
    right: LightboxPanelData | null;
};

function MatchImageLightbox({ isOpen, onClose, left, right }: MatchImageLightboxProps) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !left) return null;

    return (
        <div className="image-overlay" onClick={onClose}>
            <div className="lightbox-match-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>
                    X
                </button>
                <div className="match-container lightbox-match-container">
                    <MatchSharkBox {...left} />
                    {right && <MatchSharkBox {...right} />}
                </div>
            </div>
        </div>
    );
}

export default MatchImageLightbox;
