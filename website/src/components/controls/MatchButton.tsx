import { useState } from "react";

import {
    getGroupForShark,
    isMatchedPair,
    joinOrCreateGroup,
    mergeGroups,
    removeSharkFromGroup,
} from "../../utils/MatchUtils";
import { getGroupNote } from "../../utils/NotesUtils";
import { useMatchedGroups } from "../../hooks/useMatchedGroups";
import ConfirmModal from "./ConfirmModal";

import { MatchButtonProps } from "../../types/logbooks";
import { ConfirmModalProps } from "../../types/controls";

type PendingConfirm = Omit<ConfirmModalProps, "onClose">;

const MatchButton = ({
    querySharkId,
    matchedSharkId,
    className = "graph-panel-match-btn",
}: MatchButtonProps) => {
    // Subscribes to matched-group changes so this re-renders when they occur
    useMatchedGroups();

    const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
    const closeConfirm = () => setPendingConfirm(null);

    const saved = isMatchedPair(querySharkId, matchedSharkId);

    const handleMatchClick = () => {
        const queryGroup = getGroupForShark(querySharkId);
        const matchedGroup = getGroupForShark(matchedSharkId);

        // Already matched: deleting match pair ejects 1 of 2 sharks from shared group
        if (queryGroup && matchedGroup && queryGroup.id === matchedGroup.id) {
            const group = queryGroup;
            const otherMembers = group.sharkIds.filter(
                (id) => id !== querySharkId && id !== matchedSharkId
            );

            if (otherMembers.length === 0) {
                setPendingConfirm({
                    title: "Remove match?",
                    message: `Shark ${querySharkId} and shark ${matchedSharkId} are the only 2 sharks in this group. Removing their match will dissolve the group, since no sharks would remain.`,
                    actions: [
                        { label: "Cancel", variant: "neutral", onClick: closeConfirm },
                        {
                            label: "Remove match",
                            variant: "danger",
                            onClick: () => {
                                removeSharkFromGroup(matchedSharkId);
                                closeConfirm();
                            },
                        },
                    ],
                });
                return;
            }

            const note = getGroupNote(group.id);
            const groupLabel = group.name ? `group "${group.name}"` : "this group";

            setPendingConfirm({
                title: "Remove match?",
                message:
                    `Both shark ${querySharkId} and shark ${matchedSharkId} are in ${groupLabel}. ` +
                    `${groupLabel[0].toUpperCase() + groupLabel.slice(1)} has ${otherMembers.length} other shark${otherMembers.length === 1 ? "" : "s"}` +
                    `${note ? `, with the following notes: "${note}"` : ""}. ` +
                    `Removing their match means 1 of these sharks will leave the group. Which shark would you like to remove?`,
                actions: [
                    { label: "Cancel", variant: "neutral", onClick: closeConfirm },
                    {
                        label: `Remove ${querySharkId}`,
                        variant: "danger",
                        onClick: () => {
                            removeSharkFromGroup(querySharkId);
                            closeConfirm();
                        },
                    },
                    {
                        label: `Remove ${matchedSharkId}`,
                        variant: "danger",
                        onClick: () => {
                            removeSharkFromGroup(matchedSharkId);
                            closeConfirm();
                        },
                    },
                ],
            });
            return;
        }

        // Not matched yet, but each already belongs to a different group:
        // confirm before combining them, since it merges every shark from both
        if (queryGroup && matchedGroup && queryGroup.id !== matchedGroup.id) {
            const matchedGroupLabel = matchedGroup.name ? `group "${matchedGroup.name}"` : "another group";
            const queryGroupLabel = queryGroup.name ? `group "${queryGroup.name}"` : "another group";

            setPendingConfirm({
                title: "Combine groups?",
                message:
                    `Shark ${matchedSharkId} already belongs to ${matchedGroupLabel}, and shark ${querySharkId} already belongs to ${queryGroupLabel}. ` +
                    `Flagging them as a match will combine both groups, so every shark from both ends up together. Would you like to proceed?`,
                actions: [
                    { label: "Cancel", variant: "neutral", onClick: closeConfirm },
                    {
                        label: "Combine groups",
                        variant: "primary",
                        onClick: () => {
                            mergeGroups(queryGroup.id, matchedGroup.id);
                            closeConfirm();
                        },
                    },
                ],
            });
            return;
        }

        // Neither shark is in a group they'd need to be pulled out of:
        // safe to create or join a group directly, no confirmation needed
        joinOrCreateGroup(querySharkId, matchedSharkId);
    };

    return (
        <>
            <button
                className={`${className}${saved ? " active" : ""}`}
                onClick={(e) => {
                    e.stopPropagation();
                    handleMatchClick();
                }}
            >
                {saved ? "✓ Match pair saved" : "Save this match pair"}
            </button>

            {pendingConfirm && (
                <ConfirmModal
                    title={pendingConfirm.title}
                    message={pendingConfirm.message}
                    actions={pendingConfirm.actions}
                    onClose={closeConfirm}
                />
            )}
        </>
    );
};

export default MatchButton;