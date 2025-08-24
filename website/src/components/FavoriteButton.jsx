import React, { useState, useEffect } from "react";
import { toggleFavorite, isFavorite } from "../utils/FavoritesUtils.js";


const FavoriteButton = ({ sharkId, className = "favorite-button" }) => {
    // Purely for forcing re-render on shark favoriting / saving
    const [_, forceRender] = useState({});

    // Listen for favorites changes to ensure re-render
    useEffect(() => {
        const handleFavoritesChange = () => {
            forceRender({});
        };

        window.addEventListener('favoritesChanged', handleFavoritesChange);
        window.addEventListener('storage', handleFavoritesChange);

        return () => {
            window.removeEventListener('favoritesChanged', handleFavoritesChange);
            window.removeEventListener('storage', handleFavoritesChange);
        };
    }, []);

    return (
        <button
            className={className}
            onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(sharkId);

                // Update UI immediately
                forceRender({});
            }}
        >
            {isFavorite(sharkId) ? "★" : "☆"}
        </button>
    );
};

export default FavoriteButton;

