import { toggleFavorite, isFavorite } from "../../utils/FavoritesUtils";
import { useSavedSharkIds } from "../../hooks/useSavedSharkIds";

import { FavoriteButtonProps } from "../../types/logbooks";

const FavoriteButton = ({ sharkId, className = "favorite-button" }: FavoriteButtonProps) => {
    // Subscribes to favorites changes so this re-renders when they occur
    useSavedSharkIds();

    return (
        <button
            className={className}
            onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(sharkId);
            }}
        >
            {isFavorite(sharkId) ? "★" : "☆"}
        </button>
    );
};

export default FavoriteButton;
