import React, { useState } from "react";

import { parseImageField } from "../../utils/DataUtils.js";
import { toggleFavorite, isFavorite } from "../../utils/FavoritesUtils.js";


const CondensedSharkCard = ({ shark }) => {
    // Purely for forcing re-render on shark favoriting / saving
    const [_, forceRender] = useState({}); 

    const images = shark.image !== "Unknown" ? parseImageField(shark.image) : [];

    const sexKnown = shark.sex && shark.sex !== "Unknown";
    const stageKnown = shark.lifeStage && shark.lifeStage !== "Unknown";

    // Build description line 
    let description = "Whale shark: ";
    if (sexKnown && stageKnown) {
        description += ` ${shark.sex.toLowerCase()} ${shark.lifeStage.toLowerCase()}`;
    } 
    else if (sexKnown) {
        description += ` ${shark.sex.toLowerCase()} (life stage unknown)`;
    } 
    else if (stageKnown) {
        description += ` ${shark.lifeStage.toLowerCase()} (sex unknown)`;
    } 
    else {
        description += ` (sex & life stage unknown)`;
    }

    // Extract unique countries
    const uniqueCountries = Array.from(
        new Set(
            shark.countries
                .split(",")
                .map((entry) => entry.trim().split(" (")[0])
        )
    );

    return (
        <div className="condensed-shark-card">
            {/* Any media at top */}
            <div className="condensed-media">
                {images.length > 0 ? (
                    <img
                        src={images[0].url}
                        alt={`Image of shark ${shark.id}`}
                    />
                ) : (
                    <span className="no-image">No image available</span>
                )}
            </div>

            {/* ID + favorite toggle */}
            <div className="condensed-id-row">
                <strong>ID: {shark.id}</strong>
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

            {/* Sex + life stage */}
            <p className="condensed-traits">{description}</p>

            {/* Records summary */}
            <p className="condensed-records">
                {shark.occurrences} total records between {shark.oldest} &nbsp;...&nbsp; {shark.newest}
            </p>

            {/* Places visited */}
            <p className="condensed-places">
                Visited {uniqueCountries.join(", ")}
            </p>
        </div>
    );
};

export default CondensedSharkCard;
