import React, { useEffect, useState } from "react";


const STORAGE_KEY = "savedSharks";


function SavedSharks () {
    // Initialize from localStorage or empty set
    const [saved, setSaved] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    });

    // Allow user to reset saved whale sharks
    const clearSaved = () => {
        localStorage.removeItem(STORAGE_KEY);
        setSaved(new Set());
    };


    return (
        <div className="logbook-section saved-sharks">
            <div className="saved-sharks-header">
                <h3>Saved Sharks</h3>
                <button onClick={clearSaved} className="clear-button">
                    Clear All
                </button>
            </div>
        </div>
    );
} 

export default SavedSharks;
