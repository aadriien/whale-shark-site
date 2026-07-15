import { MatchGroup } from "../types/logbooks";
import { ConfirmRequest, ConfirmModalAction } from "../types/controls";
import {
    removeSharkFromGroup,
    moveSharkToGroup,
    splitSharkToNewGroup,
    mergeGroups,
} from "./MatchUtils";
import { getGroupNote } from "./NotesUtils";

export function labelForGroup(group: MatchGroup, fallback: string): string {
    return group.name ? `group "${group.name}"` : fallback;
}

// True once taking 1 more shark out would leave the group with 0
// members, i.e. nobody left for it to represent at all
function wouldEmpty(group: MatchGroup): boolean {
    return group.sharkIds.length - 1 < 1;
}

// True once taking 1 more shark out would leave 1 member behind.
// Group exists, but purely solo, since a "match" requires 2+ sharks
function wouldLeaveSolo(group: MatchGroup): boolean {
    return group.sharkIds.length - 1 === 1;
}

// Confirms removing a single, already-identified shark from its group,
// offering to either delete it outright or split into solo group
// Used both for the logbook's explicit remove button, and for MatchButton's
// simplest "unmatch" case (a 2-member group, where 1 shark leaves the other)
export function buildRemoveConfirm(sharkId: string, group: MatchGroup): ConfirmRequest {
    const groupLabel = labelForGroup(group, "this group");
    const otherCount = group.sharkIds.length - 1;

    const actions: ConfirmModalAction[] = [
        { label: "Cancel", variant: "neutral", onClick: () => {} },
        {
            label: "Delete",
            variant: "danger",
            onClick: () => removeSharkFromGroup(sharkId),
        },
    ];

    if (!wouldEmpty(group)) {
        actions.push({
            label: "Split into new group",
            variant: "primary",
            onClick: () => splitSharkToNewGroup(sharkId),
        });
    }

    return {
        title: "Remove from group?",
        message: wouldEmpty(group)
            ? `Shark ${sharkId} is alone in ${groupLabel}.\n\nDeleting it will remove this group entirely.`
            : `Delete shark ${sharkId} entirely, or split it out into its own new (solo) group?\n\n` +
              `Either way, ${otherCount === 1 ? "the other shark" : `the other ${otherCount} sharks`} will remain in ${groupLabel}.`,
        actions,
    };
}

// Confirms moving either a single shark, or the entire group, out of
// its current group (+ into targetGroup). Moving the whole group is
// just a merge, with targetGroup absorbing every shark from that group
export function buildMoveConfirm(
    sharkId: string,
    group: MatchGroup,
    targetGroup: MatchGroup
): ConfirmRequest {
    const groupLabel = labelForGroup(group, "this group");
    const targetLabel = labelForGroup(
        targetGroup,
        `the group of ${targetGroup.sharkIds.length} sharks`
    );

    // Origin group only has this shark, so moving dissolves that group
    if (wouldEmpty(group)) {
        return {
            title: "Move shark?",
            message: `Shark ${sharkId} is alone in ${groupLabel}.\n\nMoving it will remove this group entirely.\n\nMove it to ${targetLabel}?`,
            actions: [
                { label: "Cancel", variant: "neutral", onClick: () => {} },
                {
                    label: "Move",
                    variant: "primary",
                    onClick: () => moveSharkToGroup(sharkId, targetGroup.id),
                },
            ],
        };
    }

    return {
        title: "Move shark?",
        message: wouldLeaveSolo(group)
            ? `Shark ${sharkId} is 1 of only 2 sharks in ${groupLabel}.\n\n` +
              `Moving just this shark will leave the other alone, no longer a confirmed match.\n\n` +
              `Move it to ${targetLabel}, or move the entire group (both sharks) to consolidate?`
            : `Move shark ${sharkId} to ${targetLabel}?\n\n` +
              `Or move all ${group.sharkIds.length} sharks in ${groupLabel} to consolidate the 2 groups?`,
        actions: [
            { label: "Cancel", variant: "neutral", onClick: () => {} },
            {
                label: "Move this shark",
                variant: "primary",
                onClick: () => moveSharkToGroup(sharkId, targetGroup.id),
            },
            {
                label: "Move entire group",
                variant: "primary",
                onClick: () => mergeGroups(targetGroup.id, group.id),
            },
        ],
    };
}

// Confirms which of 2 already-matched sharks (in a group of 3+) should
// leave, since undoing 1 pairwise match no longer means a single
// unambiguous edge once a group has grown past 2 members
export function buildChooseRemoveConfirm(
    querySharkId: string,
    matchedSharkId: string,
    group: MatchGroup
): ConfirmRequest {
    const otherCount = group.sharkIds.length - 2;
    const note = getGroupNote(group.id);
    const groupLabel = labelForGroup(group, "this group");

    return {
        title: "Remove match?",
        message:
            `Both shark ${querySharkId} and shark ${matchedSharkId} are in ${groupLabel}.\n\n` +
            `${groupLabel[0].toUpperCase() + groupLabel.slice(1)} has ${otherCount} other shark${otherCount === 1 ? "" : "s"}` +
            `${note ? `, with the following notes: "${note}"` : ""}.\n\n` +
            `Removing their match means 1 of these sharks will leave the group. Which shark would you like to remove?`,
        actions: [
            { label: "Cancel", variant: "neutral", onClick: () => {} },
            {
                label: `Remove ${querySharkId}`,
                variant: "danger",
                onClick: () => removeSharkFromGroup(querySharkId),
            },
            {
                label: `Remove ${matchedSharkId}`,
                variant: "danger",
                onClick: () => removeSharkFromGroup(matchedSharkId),
            },
        ],
    };
}

// Confirms combining 2 different existing groups into 1, where the
// query shark's group absorbs the matched shark's group
export function buildMergeConfirm(
    querySharkId: string,
    matchedSharkId: string,
    queryGroup: MatchGroup,
    matchedGroup: MatchGroup
): ConfirmRequest {
    const matchedGroupLabel = labelForGroup(matchedGroup, "another group");
    const queryGroupLabel = labelForGroup(queryGroup, "another group");

    return {
        title: "Combine groups?",
        message:
            `Shark ${matchedSharkId} already belongs to ${matchedGroupLabel}, and shark ${querySharkId} already belongs to ${queryGroupLabel}.\n\n` +
            `Flagging them as a match will combine both groups, so every shark from both ends up together. Would you like to proceed?`,
        actions: [
            { label: "Cancel", variant: "neutral", onClick: () => {} },
            {
                label: "Combine groups",
                variant: "primary",
                onClick: () => mergeGroups(queryGroup.id, matchedGroup.id),
            },
        ],
    };
}
