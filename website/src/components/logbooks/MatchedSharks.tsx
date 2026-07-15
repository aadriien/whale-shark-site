import { useMemo, useState } from "react";

import { parseImageField } from "../../utils/DataUtils";
import { clearAllGroups, sortMatchedGroups } from "../../utils/MatchUtils";
import { useMatchedGroups } from "../../hooks/useMatchedGroups";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import SharkMediaLightbox from "../cards/SharkMediaLightbox";
import MatchedGroupsGrid from "./MatchedGroupsGrid";

import { WhaleSharkEntryNormalized } from "../../types/sharks";

function MatchedSharks() {
    // Subscribes to matched-group changes so this re-renders when they occur
    const groups = useMatchedGroups();
    const sortedGroups = useMemo(() => sortMatchedGroups(groups), [groups]);

    // Shark whose media lightbox is currently open, if any (+ which image is active)
    const [galleryShark, setGalleryShark] = useState<WhaleSharkEntryNormalized | null>(null);
    const [galleryIndex, setGalleryIndex] = useState(0);

    const { requestConfirm, confirmModal } = useConfirmModal();

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

            <MatchedGroupsGrid
                groups={sortedGroups}
                onOpenGallery={openGallery}
                requestConfirm={requestConfirm}
            />

            {/* Lightbox popup to cycle through a clicked shark's images */}
            {galleryShark && (
                <SharkMediaLightbox
                    images={galleryImages}
                    activeIndex={galleryIndex}
                    onNavigate={setGalleryIndex}
                    onClose={() => setGalleryShark(null)}
                />
            )}

            {confirmModal}
        </div>
    );
}

export default MatchedSharks;
