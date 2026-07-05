const STORAGE_KEY = "matchGroupNotes";

export const MAX_NOTE_LENGTH = 500;

function getAllSharkNotes(): Record<string, string> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

// A group's note is stored per current member's sharkId rather than under
// the group's own (unstable) composite key. That way, removing one shark
// from a group doesn't orphan the note. It's still found via whichever
// members remain, and only truly disappears once every member is gone
export function getGroupNote(sharkIds: string[]): string {
    const notes = getAllSharkNotes();

    for (const sharkId of sharkIds) {
        if (notes[sharkId]) return notes[sharkId];
    }

    return "";
}

export function setGroupNote(sharkIds: string[], note: string) {
    const notes = getAllSharkNotes();
    const trimmed = note.slice(0, MAX_NOTE_LENGTH);

    for (const sharkId of sharkIds) {
        if (trimmed) {
            notes[sharkId] = trimmed;
        } else {
            delete notes[sharkId];
        }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}