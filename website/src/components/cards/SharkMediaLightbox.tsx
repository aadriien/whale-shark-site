import { useEffect } from "react";
import { Camera } from "lucide-react";

import { SharkImagesLightboxProps } from "../../types/cards";

const SharkImagesLightbox = ({
    images,
    activeIndex,
    onNavigate,
    onClose,
}: SharkImagesLightboxProps) => {
    // Keyboard navigation for image carousel
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                onNavigate(Math.max(activeIndex - 1, 0));
            } else if (e.key === "ArrowRight") {
                onNavigate(Math.min(activeIndex + 1, images.length - 1));
            } else if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeIndex, images.length, onNavigate, onClose]);

    const currentImage = images[activeIndex];
    if (!currentImage) return null;

    return (
        <div className="image-overlay" onClick={onClose}>
            <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
                <button
                    className="carousel-button left"
                    onClick={() => onNavigate(Math.max(activeIndex - 1, 0))}
                    disabled={activeIndex === 0}
                >
                    &lt; {/* Left arrow for image carousel */}
                </button>

                <div className="overlay-image-wrapper">
                    <img src={currentImage.url} alt={`Expanded shark image ${activeIndex}`} />
                    <p className="overlay-meta">
                        <Camera className="credit-icon" /> Creator: {currentImage.creator} |{" "}
                        {currentImage.license}
                    </p>
                </div>

                <button
                    className="carousel-button right"
                    onClick={() => onNavigate(Math.min(activeIndex + 1, images.length - 1))}
                    disabled={activeIndex === images.length - 1}
                >
                    &gt; {/* Right arrow for image carousel */}
                </button>

                <button className="close-button" onClick={onClose}>
                    X
                </button>
            </div>
        </div>
    );
};

export default SharkImagesLightbox;
