import { useState, useEffect } from "react";

import { getFavorites } from "../utils/FavoritesUtils";

import { SavedSharkIDs } from "../types/sharks";

// Single reactive source of truth for favorited / saved shark IDs, kept in
// sync with FavoritesUtils' localStorage state. Same-tab toggles will dispatch
// "favoritesChanged", while cross-tab edits will fire native "storage" event
export function useSavedSharkIds(): SavedSharkIDs {
    const [savedIds, setSavedIds] = useState<SavedSharkIDs>(getFavorites);

    useEffect(() => {
        const handleChange = () => setSavedIds(getFavorites());

        window.addEventListener("favoritesChanged", handleChange);
        window.addEventListener("storage", handleChange);

        return () => {
            window.removeEventListener("favoritesChanged", handleChange);
            window.removeEventListener("storage", handleChange);
        };
    }, []);

    return savedIds;
}