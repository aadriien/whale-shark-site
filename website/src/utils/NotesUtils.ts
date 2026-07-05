import { MatchGroup } from "../types/logbooks";

const STORAGE_KEY = "matchGroupNotes";

export const MAX_NOTE_LENGTH = 500;

function getAllNotes(): Record<string, string> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

// Notes are keyed by group's own stable ID, so they survive sharks
// joining or leaving the group
export function getGroupNote(groupId: string): string {
    return getAllNotes()[groupId] ?? "";
}

export function setGroupNote(groupId: string, note: string) {
    const notes = getAllNotes();
    const trimmed = note.slice(0, MAX_NOTE_LENGTH);

    if (trimmed) {
        notes[groupId] = trimmed;
    } else {
        delete notes[groupId];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function deleteGroupNote(groupId: string) {
    const notes = getAllNotes();
    delete notes[groupId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function clearAllNotes() {
    localStorage.removeItem(STORAGE_KEY);
}

// One-time upgrade from the legacy per-shark note storage (where every
// member of a group carried a redundant copy of the same note) to the new
// per-group storage. For each newly-migrated group, carries over whichever
// member's note was non-empty first, matching the old "first match wins"
// lookup behavior
export function migrateLegacyNotes(groups: MatchGroup[]) {
    const legacyNotes = getAllNotes();
    const migrated: Record<string, string> = {};

    for (const group of groups) {
        const existingNote = group.sharkIds
            .map((sharkId) => legacyNotes[sharkId])
            .find((note) => Boolean(note));

        if (existingNote) {
            migrated[group.id] = existingNote;
        }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
}