import { useMemo, useState } from "react";

import SharkImageGrid from "./SharkImageGrid";
import SharkMediaLightbox from "./SharkMediaLightbox";

import { GroupedMediaGalleryProps } from "../../types/cards";
import { ImagesWithMetadata } from "../../types/sharks";

// Media gallery for a consolidated shark: shows every member's photos under
// its own "Record: {id}" header, but the lightbox treats them as 1 cohesive
// set, so arrow-key navigation flows across shark boundaries seamlessly
const GroupedMediaGallery = ({ mediaBySource }: GroupedMediaGalleryProps) => {
    const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);

    const { allImages, offsets } = useMemo(() => {
        const allImages: ImagesWithMetadata = [];
        const offsets: number[] = [];

        mediaBySource.forEach((group) => {
            offsets.push(allImages.length);
            allImages.push(...group.images);
        });

        return { allImages, offsets };
    }, [mediaBySource]);

    const openImage = (globalIndex: number) => setExpandedImageIndex(globalIndex);
    const closeImage = () => setExpandedImageIndex(null);

    return (
        <>
            <div className="shark-images-container">
                <h3>Media Gallery</h3>
                {mediaBySource.map((group, groupIndex) => {
                    const offset = offsets[groupIndex];
                    return (
                        <div key={group.sharkId} className="grouped-media-source">
                            <h4 className="media-source-header">Record: {group.sharkId}</h4>
                            <SharkImageGrid
                                images={group.images}
                                onImageClick={(localIndex) => openImage(offset + localIndex)}
                            />
                        </div>
                    );
                })}
            </div>

            {expandedImageIndex !== null && (
                <SharkMediaLightbox
                    images={allImages}
                    activeIndex={expandedImageIndex}
                    onNavigate={setExpandedImageIndex}
                    onClose={closeImage}
                />
            )}
        </>
    );
};

export default GroupedMediaGallery;