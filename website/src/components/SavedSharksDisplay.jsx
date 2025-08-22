import React, { useState, useEffect, useMemo } from "react";

import SharkBanner from "./logbooks/SharkBanner.jsx";
import { getFavorites, clearFavorites, getSavedSharks } from "../utils/FavoritesUtils.js";


function SavedSharksDisplay({ sharks, onSelect, selectedSharkId }) {
    const [savedIds, setSavedIds] = useState(new Set());

    // Load saved shark IDs from localStorage
    useEffect(() => {
        const updateSavedIds = () => {
            setSavedIds(getFavorites());
        };
        
        updateSavedIds();
        
        // Listen for storage changes (favorites modified in other tab or same tab)
        window.addEventListener('storage', updateSavedIds);
        window.addEventListener('favoritesChanged', updateSavedIds);
        
        return () => {
            window.removeEventListener('storage', updateSavedIds);
            window.removeEventListener('favoritesChanged', updateSavedIds);
        };
    }, []);

    // Filter sharks to only include saved ones
    const savedSharks = useMemo(() => {
        if (savedIds.size === 0) return [];
        
        const sharkMap = new Map(sharks.map(shark => [shark.id, shark]));
        
        // Get saved sharks that exist in the provided sharks array
        return [...savedIds]
            .map(id => sharkMap.get(id))
            .filter(Boolean) 
            .sort((a, b) => a.id.localeCompare(b.id)); 
    }, [sharks, savedIds]);

    const handleCardClick = (shark) => {
        if (onSelect) {
            onSelect(shark.id);
        }
    };

    return (
        <div className="saved-sharks-display">
            <div className="saved-sharks-header">
                <h3>Saved Sharks ({savedSharks.length})</h3>
            </div>
            
            {savedSharks.length === 0 ? (
                <div className="no-sharks-message">
                    Sorry! No whale sharks match your current filters.
                    <br/><br/>
                    Use the ⭐ button to save sharks while browsing!
                </div>
            ) : (
                <div className="scrollable-shark-list">
                    <div className="saved-sharks-grid">
                        {savedSharks.map((shark) => (
                            <div 
                                key={shark.id}
                                className={`saved-shark-card-wrapper ${
                                    shark.id === selectedSharkId ? "selected" : ""
                                }`}
                                onClick={() => handleCardClick(shark)}
                            >
                                <SharkBanner shark={shark} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SavedSharksDisplay;

