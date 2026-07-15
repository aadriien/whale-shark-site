import { MatchGroup } from "../types/logbooks";
import { ConfirmRequest } from "../types/controls";
import { removeSharkFromGroup, moveSharkToGroup, mergeGroups } from "./MatchUtils";
import { getGroupNote } from "./NotesUtils";

export function labelForGroup(group: MatchGroup, fallback: string): string {
    return group.name ? `group "${group.name}"` : fallback;
}

// True once removing 1 more shark would leave fewer than 2 members,
// i.e. nobody left to be "the same shark"
function wouldDissolve(group: MatchGroup): boolean {
    return group.sharkIds.length - 1 < 2;
}

// Confirms removing a single, already-identified shark from its group.
// Used both for the logbook's explicit remove button, and for MatchButton's
// simplest "unmatch" case (a 2-member group, where both sharks dropped)
export function buildRemoveConfirm(sharkId: string, group: MatchGroup): ConfirmRequest {
    const groupLabel = labelForGroup(group, "this group");
    return {
        title: "Remove from group?",
        message: wouldDissolve(group)
            ? `Removing shark ${sharkId} will dissolve ${groupLabel}, since no sharks would remain.`
            : `Remove shark ${sharkId} from this group of ${group.sharkIds.length} sharks?`,
        actions: [
            { label: "Cancel", variant: "neutral", onClick: () => {} },
            {
                label: "Remove",
                variant: "danger",
                onClick: () => removeSharkFromGroup(sharkId),
            },
        ],
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

    return {
        title: "Move shark?",
        message: wouldDissolve(group)
            ? `Shark ${sharkId} is the only other shark in ${groupLabel}, so moving just this shark will dissolve this group. Move it to ${targetLabel}, or move the entire group (both sharks) to consolidate?`
            : `Move shark ${sharkId} to ${targetLabel}, or move all ${group.sharkIds.length} sharks in ${groupLabel} to consolidate the 2 groups?`,
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
            `Both shark ${querySharkId} and shark ${matchedSharkId} are in ${groupLabel}. ` +
            `${groupLabel[0].toUpperCase() + groupLabel.slice(1)} has ${otherCount} other shark${otherCount === 1 ? "" : "s"}` +
            `${note ? `, with the following notes: "${note}"` : ""}. ` +
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
            `Shark ${matchedSharkId} already belongs to ${matchedGroupLabel}, and shark ${querySharkId} already belongs to ${queryGroupLabel}. ` +
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
