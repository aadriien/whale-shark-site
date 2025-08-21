const STORAGE_KEY = "savedSharks";


export function getFavorites() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
        return new Set();
    }
}


export function toggleFavorite(sharkId) {
    const favorites = getFavorites();
    
    // If whale shark already favorited / saved / starred then undo
    if (favorites.has(sharkId)) {
        favorites.delete(sharkId);
    } 
    else {
        favorites.add(sharkId);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
    
    // Dispatch event to notify components that favorites changed
    window.dispatchEvent(new CustomEvent('favoritesChanged'));
    
    return favorites;
}


export function isFavorite(sharkId) {
    return getFavorites().has(sharkId);
}


export function clearFavorites() {
    localStorage.removeItem(STORAGE_KEY);
}


