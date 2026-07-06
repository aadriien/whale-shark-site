import { useMemo, useCallback } from "react";

import SharkBanner from "../cards/SharkBanner";
import { useSavedSharkIds } from "../../hooks/useSavedSharkIds";

import { WhaleSharkEntryNormalized } from "../../types/sharks";
import { SavedSharksDisplayProps } from "../../types/panels";

function SavedSharksDisplay({
    sharks,
    onSelect,
    selectedSharkId,
    viewMode,
    selectedSharksForLab,
    onLabSelectionChange,
    highlightedIds,
}: SavedSharksDisplayProps) {
    const savedIds = useSavedSharkIds();

    // Filter sharks to only include saved ones
    const savedSharks = useMemo(() => {
        if (savedIds.size === 0) return [];

        const sharkMap = new Map(sharks.map((shark) => [shark.id, shark]));

        // Get saved sharks that exist in the provided sharks array
        return [...savedIds]
            .map((id) => sharkMap.get(id))
            .filter((s): s is NonNullable<typeof s> => Boolean(s))
            .sort((a, b) => a.id.localeCompare(b.id));
    }, [sharks, savedIds]);

    const handleCardClick = (shark: WhaleSharkEntryNormalized) => {
        if (viewMode === "multiple") {
            // In multi-select mode, toggle selection for lab
            handleLabToggle(shark.id);
        } else {
            // In individual mode, select for viewing in info panel
            if (onSelect) {
                onSelect(shark.id);
            }
        }
    };

    const handleLabToggle = useCallback(
        (sharkId: string) => {
            if (onLabSelectionChange && selectedSharksForLab) {
                const newSelection = new Set(selectedSharksForLab);
                if (newSelection.has(sharkId)) {
                    newSelection.delete(sharkId);
                } else {
                    newSelection.add(sharkId);
                }
                onLabSelectionChange(newSelection);
            }
        },
        [onLabSelectionChange, selectedSharksForLab]
    );

    return (
        <div className="saved-sharks-display">
            <div className="saved-sharks-header">
                <h3>Saved Sharks ({savedSharks.length})</h3>
            </div>

            {savedSharks.length > 0 ? (
                <div className="scrollable-shark-list">
                    <div className="saved-sharks-grid">
                        {savedSharks.map((shark) => {
                            const isSelectedForLab =
                                selectedSharksForLab && selectedSharksForLab.has(shark.id);
                            const isHighlighted = highlightedIds?.has(shark.id) ?? false;
                            return (
                                <div
                                    key={shark.id}
                                    className={`saved-shark-card-wrapper ${
                                        viewMode === "individual" &&
                                        (shark.id === selectedSharkId || isHighlighted)
                                            ? "selected"
                                            : ""
                                    } ${
                                        viewMode === "multiple" &&
                                        (isSelectedForLab || isHighlighted)
                                            ? "selected-for-lab"
                                            : ""
                                    }`}
                                    onClick={() => handleCardClick(shark)}
                                >
                                    <SharkBanner shark={shark} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : savedIds.size === 0 ? (
                <div className="no-sharks-message">
                    Sorry! No whale sharks match your current filters.
                    <br />
                    <br />
                    Use the ⭐ button to save sharks while browsing!
                </div>
            ) : null}
        </div>
    );
}

export default SavedSharksDisplay;
