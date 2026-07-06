import { Camera } from "lucide-react";

import { SharkImageGridProps } from "../../types/cards";

const SharkImageGrid = ({ images, onImageClick }: SharkImageGridProps) => {
    if (images.length === 0) {
        return <p>No media available.</p>;
    }

    return (
        <>
            {images.map((img, idx) => (
                <div key={idx} className="shark-image-card">
                    <img
                        src={img.url}
                        alt={`Shark image ${idx}`}
                        onClick={() => onImageClick(idx)}
                        style={{ cursor: "pointer" }}
                    />
                    <p className="shark-image-meta">
                        <small>
                            <Camera className="credit-icon" /> Creator: {img.creator} |{" "}
                            {img.license}
                        </small>
                    </p>
                </div>
            ))}
        </>
    );
};

export default SharkImageGrid;
