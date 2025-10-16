import { useState } from "react";

import { parseImageField } from "../../utils/DataUtils.js";
import { toggleFavorite, isFavorite } from "../../utils/FavoritesUtils.js";


function formatYearMonth(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    
    const options = { year: "numeric", month: "short" };
    return date.toLocaleDateString(undefined, options); // e.g. "Jan 2025"
}


const CondensedSharkCard = ({ shark }) => {
    // Purely for forcing re-render on shark favoriting / saving
    const [_, forceRender] = useState({}); 

    const images = shark.image !== "Unknown" ? parseImageField(shark.image) : [];

    const sexKnown = shark.sex && shark.sex !== "Unknown";
    const stageKnown = shark.lifeStage && shark.lifeStage !== "Unknown";

    // Build traits description line 
    let traitsDescription;
    if (sexKnown && stageKnown) {
        traitsDescription = ` ${shark.sex.toLowerCase()} ${shark.lifeStage.toLowerCase()}`;
    } 
    else if (sexKnown) {
        traitsDescription = ` ${shark.sex.toLowerCase()} (life stage unknown)`;
    } 
    else if (stageKnown) {
        traitsDescription = ` ${shark.lifeStage.toLowerCase()} (sex unknown)`;
    } 
    else {
        traitsDescription = ` (sex & life stage unknown)`;
    }

    let dateRange = "";
    const oldestFormatted = formatYearMonth(shark.oldest);
    const newestFormatted = formatYearMonth(shark.newest);

    // Build dated records line (single date if just 1 occurrence)
    if (shark.occurrences === 1) {
        if (oldestFormatted) {
            dateRange = `in ${oldestFormatted}`;
        } 
        else if (newestFormatted) {
            dateRange = `in ${newestFormatted}`;
        } 
        else {
            dateRange = "(date unknown)";
        }
    } 
    else {
        if (oldestFormatted && newestFormatted) {
            dateRange = `between ${oldestFormatted} - ${newestFormatted}`;
        } 
        else if (oldestFormatted) {
            dateRange = `from ${oldestFormatted}`;
        } 
        else if (newestFormatted) {
            dateRange = `until ${newestFormatted}`;
        } 
        else {
            dateRange = "(date unknown)";
        }
    }

    let recordsDescription = `${shark.occurrences} `;
    recordsDescription += shark.occurrences === 1 ? "record " : "records ";
    recordsDescription += dateRange;

    // Extract unique countries
    const uniqueCountries = Array.from(
        new Set(
            shark.countries
                .split(",")
                .map((entry) => entry.trim().split(" (")[0])
        )
    ).sort();

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
            <p className="condensed-traits">{traitsDescription}</p>

            {/* Records summary */}
            <p className="condensed-records">{recordsDescription}</p>

            {/* Places visited */}
            <p className="condensed-places">
                Visited: {uniqueCountries.join(", ")}
            </p>
        </div>
    );
};

export default CondensedSharkCard;

