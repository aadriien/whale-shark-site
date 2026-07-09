import { GlobeImageOverlayProps } from "../../types/globes";

const GlobeImageOverlay = ({ imageUrl }: GlobeImageOverlayProps) => {
    if (!imageUrl) return null;

    return (
        <div className="globe-image-overlay">
            <img src={imageUrl} alt="Whale shark sighting" />
        </div>
    );
};

export default GlobeImageOverlay;