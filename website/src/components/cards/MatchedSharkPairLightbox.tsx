import { useEffect } from "react";

import MatchSharkBox from "./MatchSharkBox";
import MatchButton from "../controls/MatchButton";
import { MatchedPairLightboxProps } from "../../types/cards";

function MatchedSharkPairLightbox({
    isOpen,
    onClose,
    left,
    right,
    querySharkId,
    matchSharkId,
    distanceLabel,
    distanceValue,
}: MatchedPairLightboxProps) {
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
                <div className="lightbox-match-topbar">
                    <MatchButton querySharkId={querySharkId} matchedSharkId={matchSharkId} />
                    <span className="lightbox-match-distance">
                        {distanceLabel}: {distanceValue.toFixed(4)}
                    </span>
                    <button className="close-button" onClick={onClose}>
                        X
                    </button>
                </div>

                <div className="match-container lightbox-match-container">
                    <MatchSharkBox {...left} />
                    {right && <MatchSharkBox {...right} />}
                </div>
            </div>
        </div>
    );
}

export default MatchedSharkPairLightbox;
