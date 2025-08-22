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


export function getSavedSharks(sharks) {
    const savedIds = getFavorites();
    
    if (savedIds.size === 0) return [];
    
    // Build lookup map for performance
    const sharkMap = new Map(sharks.map(shark => [shark.id, shark]));
    
    // Get saved sharks that exist in provided array
    return [...savedIds]
        .map(id => sharkMap.get(id))
        .filter(Boolean) 
        .sort((a, b) => a.id.localeCompare(b.id)); 
}


export function getSavedSharkIds() {
    return [...getFavorites()];
}


