import React, { useState } from "react";

import { getGroupNote, setGroupNote, MAX_NOTE_LENGTH } from "../../utils/NotesUtils";

import { MatchGroupNotesProps } from "../../types/logbooks";

function MatchGroupNotes({ sharkIds }: MatchGroupNotesProps) {
    const [note, setNote] = useState(() => getGroupNote(sharkIds));

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = event.target.value.slice(0, MAX_NOTE_LENGTH);
        setNote(value);
        setGroupNote(sharkIds, value);
    };

    return (
        <div className="match-notes-box">
            <div className="match-notes-header">
                <span>Notes — {sharkIds.length} sharks</span>
            </div>

            <textarea
                className="match-notes-textarea"
                value={note}
                onChange={handleChange}
                maxLength={MAX_NOTE_LENGTH}
                placeholder="Your notes for this match group..."
            />
        </div>
    );
}

export default MatchGroupNotes;
