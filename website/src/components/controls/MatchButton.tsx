import { getGroupForShark, isMatchedPair, joinOrCreateGroup } from "../../utils/MatchUtils";
import {
    buildRemoveConfirm,
    buildChooseRemoveConfirm,
    buildMergeConfirm,
} from "../../utils/MatchConfirmUtils";
import { useMatchedGroups } from "../../hooks/useMatchedGroups";
import { useConfirmModal } from "../../hooks/useConfirmModal";

import { MatchButtonProps } from "../../types/logbooks";

const MatchButton = ({
    querySharkId,
    matchedSharkId,
    className = "graph-panel-match-btn",
}: MatchButtonProps) => {
    // Subscribes to matched-group changes so this re-renders when they occur
    useMatchedGroups();

    const { requestConfirm, confirmModal } = useConfirmModal();

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

            requestConfirm(
                otherMembers.length === 0
                    ? buildRemoveConfirm(matchedSharkId, group)
                    : buildChooseRemoveConfirm(querySharkId, matchedSharkId, group)
            );
            return;
        }

        // Not matched yet, but each already belongs to a different group:
        // confirm before combining them, since it merges every shark from both
        if (queryGroup && matchedGroup && queryGroup.id !== matchedGroup.id) {
            requestConfirm(
                buildMergeConfirm(querySharkId, matchedSharkId, queryGroup, matchedGroup)
            );
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

            {confirmModal}
        </>
    );
};

export default MatchButton;
