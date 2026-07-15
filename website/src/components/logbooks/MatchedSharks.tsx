import { useMemo, useState } from "react";

import { mediaSharks, parseImageField } from "../../utils/DataUtils";
import { clearAllGroups, groupDisplayLabel } from "../../utils/MatchUtils";
import { buildRemoveConfirm, buildMoveConfirm } from "../../utils/MatchConfirmUtils";
import { getGroupNote } from "../../utils/NotesUtils";
import { useMatchedGroups } from "../../hooks/useMatchedGroups";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import SharkBanner from "../cards/SharkBanner";
import SharkMediaLightbox from "../cards/SharkMediaLightbox";
import MatchGroupNotes from "./MatchGroupNotes";

import { WhaleSharkEntryNormalized } from "../../types/sharks";
import { MatchGroup, MatchRemoveButtonProps, MatchMoveSelectProps } from "../../types/logbooks";

// Larger groups first; among ties, named groups before unnamed, then
// noted groups before un-noted. No further tiebreaking beyond that
function sortMatchedGroups(groups: MatchGroup[]): MatchGroup[] {
    return [...groups].sort((a, b) => {
        if (b.sharkIds.length !== a.sharkIds.length) {
            return b.sharkIds.length - a.sharkIds.length;
        }

        const aHasName = Boolean(a.name?.trim());
        const bHasName = Boolean(b.name?.trim());
        if (aHasName !== bHasName) return aHasName ? -1 : 1;

        const aHasNote = Boolean(getGroupNote(a.id));
        const bHasNote = Boolean(getGroupNote(b.id));
        if (aHasNote !== bHasNote) return aHasNote ? -1 : 1;

        return 0;
    });
}

function MatchRemoveButton({ sharkId, onRemove }: MatchRemoveButtonProps) {
    return (
        <button
            className="match-remove-btn"
            onClick={() => onRemove(sharkId)}
            aria-label={`Remove ${sharkId} from this matched group`}
        >
            ✕
        </button>
    );
}

// Lets user pick a different (existing) group to move this shark into.
// Button is disabled when there's nowhere else to move it
function MatchMoveSelect({ sharkId, otherGroups, onMove }: MatchMoveSelectProps) {
    return (
        <select
            className="match-move-select"
            value=""
            disabled={otherGroups.length === 0}
            onChange={(e) => {
                const targetGroupId = e.target.value;
                if (targetGroupId) onMove(sharkId, targetGroupId);
            }}
            aria-label={`Move ${sharkId} to a different matched group`}
        >
            <option value="" disabled hidden>
                →
            </option>
            {otherGroups.map((group) => (
                <option key={group.id} value={group.id}>
                    {groupDisplayLabel(group)}
                </option>
            ))}
        </select>
    );
}

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

            <div className="matched-groups">
                {sortedGroups.length > 0 ? (
                    sortedGroups.map((group) => {
                        const otherGroups = sortedGroups.filter((g) => g.id !== group.id);

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
                                                    <div className="matched-banner-controls">
                                                        <MatchRemoveButton
                                                            sharkId={sharkId}
                                                            onRemove={(id) =>
                                                                requestConfirm(
                                                                    buildRemoveConfirm(id, group)
                                                                )
                                                            }
                                                        />
                                                        <MatchMoveSelect
                                                            sharkId={sharkId}
                                                            otherGroups={otherGroups}
                                                            onMove={(id, targetGroupId) => {
                                                                const targetGroup =
                                                                    otherGroups.find(
                                                                        (g) =>
                                                                            g.id === targetGroupId
                                                                    );
                                                                if (targetGroup) {
                                                                    requestConfirm(
                                                                        buildMoveConfirm(
                                                                            id,
                                                                            group,
                                                                            targetGroup
                                                                        )
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                    </div>
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

            {confirmModal}
        </div>
    );
}

export default MatchedSharks;
