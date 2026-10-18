import LightboxOverlay from "../controls/LightboxOverlay";
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
    if (!isOpen || !left) return null;

    return (
        <LightboxOverlay onClose={onClose} contentClassName="lightbox-match-content">
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
        </LightboxOverlay>
    );
}

export default MatchedSharkPairLightbox;
