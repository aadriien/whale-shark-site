import { useState } from "react";

import CondensedSharkCard from "../cards/CondensedSharkCard.jsx";
import { mediaSharks } from "../../utils/DataUtils";

import { SavedSharkIDs } from "../../types/sharks"


const STORAGE_KEY = "savedSharks";

function retrieveSharks(saved: SavedSharkIDs) {
    if (!saved || saved.size === 0) return [];
    
    // Build lookup map for fast retrieval: { sharkID -> sharkObject }
    const sharkMap = new Map(mediaSharks.map(shark => [shark.id, shark]));

    // Convert set of saved IDs into shark objects, filtering out any missing
    return [...saved]
        .map(id => sharkMap.get(id) || null)
        .filter(Boolean);
}


const CondensedGrid = ({ saved }: {saved: SavedSharkIDs}) => {
    const sharks = retrieveSharks(saved);
    console.log(sharks)

    return (
        <div className="condensed-shark-grid">
            {sharks.map((shark) => (
                <CondensedSharkCard key={shark.id} shark={shark} />
            ))}
        </div>
    );
};


function SavedSharks () {
    // Initialize from localStorage or empty set
    const [saved, setSaved] = useState<SavedSharkIDs>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    });

    // Allow user to reset saved whale sharks
    const clearSaved = () => {
        const isConfirmed = confirm(`
            STOP! WAIT!\n\n
            Are you sure you want to erase all of your saved whale sharks? 
            This cannot be undone.
        `);

        if (isConfirmed) {
            const isConfirmedAgain = confirm(`Seriously, last chance!`);
            
            if (isConfirmedAgain) {
                localStorage.removeItem(STORAGE_KEY);
                setSaved(new Set());
            }
        }
    };

    return (
        <div className="logbook-section saved-sharks">
            <div className="visited-saved-header">
                <h3>Saved Sharks</h3>
                <button onClick={clearSaved} className="clear-button">
                    Clear All
                </button>
            </div>

            <div className="saved-grid">
                {saved.size > 0 ? (
                    <CondensedGrid saved={saved} />
                ) : (
                    <p>No whale sharks saved</p>
                )}
            </div>
        </div>
    );
} 

export default SavedSharks;

