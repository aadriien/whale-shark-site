import { useState, useEffect, useMemo, useCallback } from "react";

import SharkBanner from "../cards/SharkBanner";
import { getFavorites } from "../../utils/FavoritesUtils";

import { WhaleSharkEntryNormalized } from "../../types/sharks";
import { SavedSharksDisplayProps } from "../../types/panels";


function SavedSharksDisplay({ 
    sharks, 
    onSelect, selectedSharkId, 
    viewMode, 
    selectedSharksForLab, onLabSelectionChange 
}: SavedSharksDisplayProps) {
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    // Load saved shark IDs from localStorage
    useEffect(() => {
        const updateSavedIds = () => {
            setSavedIds(getFavorites());
            setIsInitialized(true);
        };
        
        updateSavedIds();
        
        // Listen for storage changes (favorites modified in other tab or same tab)
        window.addEventListener("storage", updateSavedIds);
        window.addEventListener("favoritesChanged", updateSavedIds);
        
        return () => {
            window.removeEventListener("storage", updateSavedIds);
            window.removeEventListener("favoritesChanged", updateSavedIds);
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

    const handleCardClick = (shark: WhaleSharkEntryNormalized) => {
        if (viewMode === "multiple") {
            // In multi-select mode, toggle selection for lab
            handleLabToggle(shark.id);
        } 
        else {
            // In individual mode, select for viewing in info panel
            if (onSelect) {
                onSelect(shark.id);
            }
        }
    };

    const handleLabToggle = useCallback((sharkId: string) => {
        if (onLabSelectionChange && selectedSharksForLab) {
            const newSelection = new Set(selectedSharksForLab);
            if (newSelection.has(sharkId)) {
                newSelection.delete(sharkId);
            } 
            else {
                newSelection.add(sharkId);
            }
            onLabSelectionChange(newSelection);
        }
    }, [onLabSelectionChange, selectedSharksForLab]);

    return (
        <div className="saved-sharks-display">
            <div className="saved-sharks-header">
                <h3>Saved Sharks ({savedSharks.length})</h3>
            </div>
            
            {savedSharks.length > 0 ? (
                <div className="scrollable-shark-list">
                    <div className="saved-sharks-grid">
                        {savedSharks.map((shark) => {
                            const isSelectedForLab = selectedSharksForLab && selectedSharksForLab.has(shark.id);
                            return (
                                <div 
                                    key={shark.id}
                                    className={`saved-shark-card-wrapper ${
                                        viewMode === "individual" && shark.id === selectedSharkId ? "selected" : ""
                                    } ${
                                        viewMode === "multiple" && isSelectedForLab ? "selected-for-lab" : ""
                                    }`}
                                    onClick={() => handleCardClick(shark)}
                                >
                                    <SharkBanner shark={shark} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                isInitialized && savedIds.size === 0 ? (
                    <div className="no-sharks-message">
                        Sorry! No whale sharks match your current filters.
                        <br/><br/>
                        Use the ⭐ button to save sharks while browsing!
                    </div>
                ) : null
            )}
        </div>
    );
}

export default SavedSharksDisplay;

