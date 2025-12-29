import { parseImageField } from "../../utils/DataUtils";
import FavoriteButton from "../controls/FavoriteButton";

import { IndividualSharkProps } from "../../types/sharks";


const SharkBanner = ({ shark }: IndividualSharkProps) => {
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

