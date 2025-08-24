import { parseImageField } from "../../utils/DataUtils.js";
import FavoriteButton from "../FavoriteButton.jsx";


const SharkBanner = ({ shark }) => {
    const images = shark.image !== "Unknown" ? parseImageField(shark.image) : [];

    return (
        <div className="shark-banner">
            {/* Any media */}
            <div className="tiny-banner-media">
                {images.length > 0 ? (
                    <img
                        src={images[0].url}
                        alt={`Image of shark ${shark.id}`}
                    />
                ) : (
                    <span className="no-image">N/A</span>
                )}
            </div>

            {/* ID + favorite toggle */}
            <div className="tiny-id-row">
                <strong>{shark.id}</strong>
                <FavoriteButton sharkId={shark.id} />
            </div>
        </div>
    );
};

export default SharkBanner;

