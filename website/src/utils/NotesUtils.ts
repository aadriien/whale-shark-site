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