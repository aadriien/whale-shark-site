import { useState } from "react";

import { mediaSharks, parseImageField } from "../../utils/DataUtils";
import { removeSharkFromGroup, clearAllGroups } from "../../utils/MatchUtils";
import { useMatchedGroups } from "../../hooks/useMatchedGroups";
import SharkBanner from "../cards/SharkBanner";
import SharkMediaLightbox from "../cards/SharkMediaLightbox";
import MatchGroupNotes from "./MatchGroupNotes";

import { WhaleSharkEntryNormalized } from "../../types/sharks";

function MatchedSharks() {
    // Subscribes to matched-group changes so this re-renders when they occur
    const groups = useMatchedGroups();

    // Shark whose media lightbox is currently open, if any (+ which image is active)
    const [galleryShark, setGalleryShark] = useState<WhaleSharkEntryNormalized | null>(null);
    const [galleryIndex, setGalleryIndex] = useState(0);

    const openGallery = (shark: WhaleSharkEntryNormalized) => {
        setGalleryShark(shark);
        setGalleryIndex(0);
    };

    const galleryImages =
        galleryShark && galleryShark.image !== "Unknown" ? parseImageField(galleryShark.image) : [];

    // Allow user to reset saved match pairs
    const clearMatches = () => {
        const isConfirmed = confirm(`
            STOP! WAIT!\n\n
            Are you sure you want to erase all of your saved match pairs?
            This cannot be undone.
        `);

        if (isConfirmed) {
            const isConfirmedAgain = confirm(`Seriously, last chance!`);

            if (isConfirmedAgain) {
                clearAllGroups();
            }
        }
    };

    return (
        <div className="logbook-section matched-sharks">
            <div className="visited-saved-header">
                <h3>Matched Sharks</h3>
                <button onClick={clearMatches} className="clear-button">
                    Clear All
                </button>
            </div>

            <div className="matched-groups">
                {groups.length > 0 ? (
                    groups.map((group) => {
                        return (
                            <div key={group.id} className="matched-group-box">
                                <div className="matched-group-layout">
                                    <div className="matched-group-banners">
                                        {group.sharkIds.map((sharkId) => {
                                            const shark = mediaSharks.find((s) => s.id === sharkId);

                                            return (
                                                <div
                                                    key={sharkId}
                                                    className="matched-banner-wrapper"
                                                >
                                                    <button
                                                        className="match-remove-btn"
                                                        onClick={() =>
                                                            removeSharkFromGroup(sharkId)
                                                        }
                                                        aria-label={`Remove ${sharkId} from this matched group`}
                                                    >
                                                        ✕
                                                    </button>
                                                    {shark ? (
                                                        <SharkBanner
                                                            shark={shark}
                                                            onImageClick={() => openGallery(shark)}
                                                        />
                                                    ) : (
                                                        <p className="graph-panel-missing">
                                                            No data for ID {sharkId}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <MatchGroupNotes group={group} />
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p>No matched shark pairs saved</p>
                )}
            </div>

            {/* Lightbox popup to cycle through a clicked shark's images */}
            {galleryShark && (
                <SharkMediaLightbox
                    images={galleryImages}
                    activeIndex={galleryIndex}
                    onNavigate={setGalleryIndex}
                    onClose={() => setGalleryShark(null)}
                />
            )}
        </div>
    );
}

export default MatchedSharks;
