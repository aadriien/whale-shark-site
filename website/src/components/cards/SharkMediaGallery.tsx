import { useState } from "react";
import { Camera } from "lucide-react";

import { parseImageField } from "../../utils/DataUtils";
import SharkImagesLightbox from "./SharkImagesLightbox";

import { IndividualSharkProps } from "../../types/sharks";

const SharkMediaGallery = ({ shark }: IndividualSharkProps) => {
    const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);

    const images = shark && shark.image !== "Unknown" ? parseImageField(shark.image) : [];

    // Open lightbox with image index, not just image object
    const openImage = (index: number) => setExpandedImageIndex(index);
    const closeImage = () => setExpandedImageIndex(null);

    return (
        <>
            <div className="shark-images-container">
                <h3>Media Gallery</h3>
                {images.length > 0 ? (
                    images.map((img, idx) => (
                        <div key={idx} className="shark-image-card">
                            <img
                                src={img.url}
                                alt={`Shark image ${idx}`}
                                onClick={() => openImage(idx)}
                                style={{ cursor: "pointer" }}
                            />
                            <p className="shark-image-meta">
                                <small>
                                    <Camera className="credit-icon" /> Creator: {img.creator} |{" "}
                                    {img.license}
                                </small>
                            </p>
                        </div>
                    ))
                ) : (
                    <p>No media available.</p>
                )}
            </div>

            {/* Lightbox Overlay */}
            {expandedImageIndex !== null && (
                <SharkImagesLightbox
                    images={images}
                    activeIndex={expandedImageIndex}
                    onNavigate={setExpandedImageIndex}
                    onClose={closeImage}
                />
            )}
        </>
    );
};

export default SharkMediaGallery;
