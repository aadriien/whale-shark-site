import React, { useState } from "react";

import { getGroupNote, setGroupNote, MAX_NOTE_LENGTH } from "../../utils/NotesUtils";
import { setGroupName } from "../../utils/MatchUtils";

import { MatchGroupNotesProps } from "../../types/logbooks";

const MAX_NAME_LENGTH = 60;

function MatchGroupNotes({ group }: MatchGroupNotesProps) {
    const [note, setNote] = useState(() => getGroupNote(group.id));
    const [name, setName] = useState(group.name ?? "");

    const handleNoteChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = event.target.value.slice(0, MAX_NOTE_LENGTH);
        setNote(value);
        setGroupNote(group.id, value);
    };

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value.slice(0, MAX_NAME_LENGTH);
        setName(value);
        setGroupName(group.id, value);
    };

    return (
        <div className="match-notes-box">
            <div className="match-notes-header">
                <input
                    className="match-group-name-input"
                    value={name}
                    onChange={handleNameChange}
                    maxLength={MAX_NAME_LENGTH}
                    placeholder="Your group name..."
                    aria-label="Group name"
                />
                <span className="match-group-name-count">({group.sharkIds.length})</span>
            </div>

            <textarea
                className="match-notes-textarea"
                value={note}
                onChange={handleNoteChange}
                maxLength={MAX_NOTE_LENGTH}
                placeholder="Your notes for this match group..."
            />
        </div>
    );
}

export default MatchGroupNotes;
