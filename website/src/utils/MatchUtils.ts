import { MatchGroup } from "../types/logbooks";
import {
    clearAllNotes,
    deleteGroupNote,
    getGroupNote,
    setGroupNote,
    migrateLegacyNotes,
    MAX_NOTE_LENGTH,
} from "./NotesUtils";

const STORAGE_KEY = "matchedSharkGroups";
const GROUPS_CHANGED_EVENT = "matchedGroupsChanged";

// Legacy storage this replaces: a flat set of "sharkIdA::sharkIdB" edges,
// with groups derived transitively (connected components) on every read.
// That worked for simple pairwise toggling, but had no stable identity for
// a group, so notes/names couldn't attach to it, and detaching one shark
// could silently sever the rest of the group if it wasn't fully connected
// internally (e.g. a "star" of edges all going through the removed shark)
const LEGACY_PAIRS_KEY = "matchedSharkPairs";
const LEGACY_PAIR_DELIMITER = "::";

function readGroups(): MatchGroup[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function writeGroups(groups: MatchGroup[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
    window.dispatchEvent(new CustomEvent(GROUPS_CHANGED_EVENT));
}

// Runs once: converts the legacy edge list into explicit groups with a
// stable id each, then carries notes over and removes the legacy key
function migrateLegacyPairsIfNeeded() {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const legacyRaw = localStorage.getItem(LEGACY_PAIRS_KEY);
    if (!legacyRaw) return;

    let pairKeys: string[];
    try {
        pairKeys = JSON.parse(legacyRaw);
    } catch {
        return;
    }

    const adjacency = new Map<string, Set<string>>();
    for (const key of pairKeys) {
        const [sharkIdA, sharkIdB] = key.split(LEGACY_PAIR_DELIMITER);
        if (!adjacency.has(sharkIdA)) adjacency.set(sharkIdA, new Set());
        if (!adjacency.has(sharkIdB)) adjacency.set(sharkIdB, new Set());
        adjacency.get(sharkIdA)!.add(sharkIdB);
        adjacency.get(sharkIdB)!.add(sharkIdA);
    }

    const visited = new Set<string>();
    const groups: MatchGroup[] = [];

    for (const sharkId of adjacency.keys()) {
        if (visited.has(sharkId)) continue;

        const sharkIds: string[] = [];
        const queue = [sharkId];
        visited.add(sharkId);

        while (queue.length > 0) {
            const current = queue.shift()!;
            sharkIds.push(current);

            for (const neighbor of adjacency.get(current) ?? []) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }

        groups.push({ id: crypto.randomUUID(), sharkIds });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
    migrateLegacyNotes(groups);
    localStorage.removeItem(LEGACY_PAIRS_KEY);
}

export function getGroups(): MatchGroup[] {
    migrateLegacyPairsIfNeeded();
    return readGroups();
}

export function getGroupForShark(sharkId: string): MatchGroup | undefined {
    return getGroups().find((group) => group.sharkIds.includes(sharkId));
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
    localStorage.removeItem(LEGACY_PAIRS_KEY);
    clearAllNotes();
    window.dispatchEvent(new CustomEvent(GROUPS_CHANGED_EVENT));
}