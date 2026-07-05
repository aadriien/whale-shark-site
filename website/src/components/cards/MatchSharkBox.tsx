import { Camera } from "lucide-react";

import FavoriteButton from "../controls/FavoriteButton";
import { MatchSharkBoxProps } from "../../types/cards";

function MatchSharkBox({
    label,
    sharkId,
    countries,
    oldest,
    newest,
    images,
    activeIndex,
    onSelectThumbnail,
    imagesLabel = "All Images",
    noImagesMessage = "No other images for this whale shark",
    footer,
}: MatchSharkBoxProps) {
    const mainImage = images[activeIndex];

    return (
        <div className="match-shark-box">
            <div className="match-shark-info-box">
                <div className="match-shark-id-row">
                    <span className="match-shark-label">{label}:</span>
                    <span className="match-shark-id-value">{sharkId}</span>
                    <FavoriteButton sharkId={sharkId} />
                </div>
                <div className="match-shark-details-row">
                    <span className="match-shark-meta">{countries}</span>
                    <span className="match-shark-meta">
                        ({oldest} to {newest})
                    </span>
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
                        <p className="shark-image-meta">
                            <small>
                                <Camera className="credit-icon" /> Creator:{" "}
                                {mainImage.creator ?? "Unknown"} | {mainImage.license ?? "Unknown"}
                            </small>
                        </p>
                    </>
                ) : (
                    <p className="match-no-matches">No image available</p>
                )}
            </div>

            <div className="match-images-grid">
                <h6>
                    {imagesLabel} ({images.length}):
                </h6>
                {images.length > 1 ? (
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
                ) : (
                    <p className="match-no-other-images">{noImagesMessage}</p>
                )}
            </div>

            {footer}
        </div>
    );
}

export default MatchSharkBox;