import { useEffect } from "react";
import { Camera } from "lucide-react";

import { LightboxPanelData } from "../../../types/graphs";

type MatchImageLightboxProps = {
    isOpen: boolean;
    onClose: () => void;
    left: LightboxPanelData | null;
    right: LightboxPanelData | null;
};

function LightboxPanel({ sharkId, title, images, activeIndex, onSelectThumbnail }: LightboxPanelData) {
    const mainImage = images[activeIndex];

    return (
        <div className="match-shark-box">
            <div className="match-shark-info-box">
                <div className="match-shark-id-row">
                    <span className="match-shark-label">{title}</span>
                    <span className="match-shark-id-value">{sharkId}</span>
                </div>
            </div>

            <div className="image-wrapper-large">
                {mainImage ? (
                    <>
                        <img
                            src={mainImage.url}
                            alt={`Shark ${sharkId}`}
                            className="match-main-image"
                        />
                        {(mainImage.creator || mainImage.license) && (
                            <p className="shark-image-meta">
                                <small>
                                    <Camera className="credit-icon" /> Creator:{" "}
                                    {mainImage.creator ?? "Unknown"} | {mainImage.license ?? "Unknown"}
                                </small>
                            </p>
                        )}
                    </>
                ) : (
                    <p className="match-no-matches">No image available</p>
                )}
            </div>

            {images.length > 1 && (
                <div className="match-images-grid">
                    <h6>All Images ({images.length}):</h6>
                    <div className="match-thumbnails">
                        {images.map((img, idx) => (
                            <div
                                key={idx}
                                className={`match-thumbnail-item ${activeIndex === idx ? "active" : ""}`}
                                onClick={() => onSelectThumbnail(idx)}
                            >
                                <img src={img.url} alt={`Shark ${sharkId} image ${idx + 1}`} />
                                <div className="match-thumbnail-label">{idx + 1}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

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
                    <LightboxPanel {...left} />
                    {right && <LightboxPanel {...right} />}
                </div>
            </div>
        </div>
    );
}

export default MatchImageLightbox;