import React, { useState } from "react";

import { parseImageField } from "../../utils/DataUtils.js";
import { toggleFavorite, isFavorite } from "../../utils/FavoritesUtils.js";


const SharkBanner = ({ shark }) => {
    // Purely for forcing re-render on shark favoriting / saving
    const [_, forceRender] = useState({}); 

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
                <button
                    className="favorite-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(shark.id);
                        forceRender({});
                    }}
                >
                    {isFavorite(shark.id) ? "★" : "☆"}
                </button>
            </div>
        </div>
    );
};

export default SharkBanner;
