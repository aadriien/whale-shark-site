import { MatchGroup, NamedSharkGroup } from "../types/logbooks";
import { clearAllNotes, deleteGroupNote, getGroupNote, setGroupNote, MAX_NOTE_LENGTH } from "./NotesUtils";

const STORAGE_KEY = "matchedSharkGroups";
const GROUPS_CHANGED_EVENT = "matchedGroupsChanged";

function writeGroups(groups: MatchGroup[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
    window.dispatchEvent(new CustomEvent(GROUPS_CHANGED_EVENT));
}

export function getGroups(): MatchGroup[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

export function getGroupForShark(sharkId: string): MatchGroup | undefined {
    return getGroups().find((group) => group.sharkIds.includes(sharkId));
}

// Group name if set, otherwise its member IDs, comma-separated
export function groupDisplayLabel(group: NamedSharkGroup): string {
    return group.name?.trim() || group.sharkIds.join(", ");
}

export function isMatchedPair(querySharkId: string, matchedSharkId: string): boolean {
    const group = getGroupForShark(querySharkId);
    return Boolean(group && group.sharkIds.includes(matchedSharkId));
}

export function setGroupName(groupId: string, name: string) {
    const groups = getGroups();
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    group.name = name.trim() || undefined;
    writeGroups(groups);
}

// Adds a match between 2 sharks that aren't already in the same group.
// Joins an existing group if either shark already belongs to one, otherwise
// starts a new one. Combining 2 DIFFERENT existing groups is a separate,
// user-confirmed operation (see mergeGroups)
export function joinOrCreateGroup(querySharkId: string, matchedSharkId: string) {
    const groups = getGroups();
    const queryGroup = groups.find((g) => g.sharkIds.includes(querySharkId));
    const matchedGroup = groups.find((g) => g.sharkIds.includes(matchedSharkId));

    if (queryGroup && !matchedGroup) {
        queryGroup.sharkIds.push(matchedSharkId);
    } else if (matchedGroup && !queryGroup) {
        matchedGroup.sharkIds.push(querySharkId);
    } else if (!queryGroup && !matchedGroup) {
        groups.push({ id: crypto.randomUUID(), sharkIds: [querySharkId, matchedSharkId] });
    }

    writeGroups(groups);
}

// Combines 2 existing groups into 1. The "into" group keeps its ID, name,
// note, etc. The "from" group gets discarded, but its note is appended
export function mergeGroups(intoGroupId: string, fromGroupId: string) {
    const groups = getGroups();
    const intoGroup = groups.find((g) => g.id === intoGroupId);
    const fromGroup = groups.find((g) => g.id === fromGroupId);
    if (!intoGroup || !fromGroup) return;

    intoGroup.sharkIds = [...intoGroup.sharkIds, ...fromGroup.sharkIds];
    const remaining = groups.filter((g) => g.id !== fromGroupId);

    writeGroups(remaining);

    const intoNote = getGroupNote(intoGroupId);
    const fromNote = getGroupNote(fromGroupId);
    deleteGroupNote(fromGroupId);

    if (fromNote) {
        const combinedNote = intoNote ? `${intoNote}\n${fromNote}` : fromNote;
        setGroupNote(intoGroupId, combinedNote.slice(0, MAX_NOTE_LENGTH));
    }
}

// Removes a shark from whichever group it's in. If < 2 members
// remain, the group no longer represents a match, so it dissolves
// entirely (along with its note, if it exists)
function detachSharkFromGroup(groups: MatchGroup[], sharkId: string): MatchGroup[] {
    const group = groups.find((g) => g.sharkIds.includes(sharkId));
    if (!group) return groups;

    const remainingMembers = group.sharkIds.filter((id) => id !== sharkId);

    if (remainingMembers.length < 2) {
        deleteGroupNote(group.id);
        return groups.filter((g) => g.id !== group.id);
    }

    return groups.map((g) => (g.id === group.id ? { ...g, sharkIds: remainingMembers } : g));
}

export function removeSharkFromGroup(sharkId: string) {
    writeGroups(detachSharkFromGroup(getGroups(), sharkId));
}

export function moveSharkToGroup(sharkId: string, targetGroupId: string) {
    const groups = detachSharkFromGroup(getGroups(), sharkId);
    const targetGroup = groups.find((g) => g.id === targetGroupId);
    if (!targetGroup) return;

    targetGroup.sharkIds.push(sharkId);
    writeGroups(groups);
}

export function clearAllGroups() {
    localStorage.removeItem(STORAGE_KEY);
    clearAllNotes();
    window.dispatchEvent(new CustomEvent(GROUPS_CHANGED_EVENT));
}