import { useState } from "react";

import { parseImageField } from "../../utils/DataUtils";
import SharkImageGrid from "./SharkImageGrid";
import SharkMediaLightbox from "./SharkMediaLightbox";

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
                <SharkImageGrid images={images} onImageClick={openImage} />
            </div>

            {/* Lightbox Overlay */}
            {expandedImageIndex !== null && (
                <SharkMediaLightbox
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
