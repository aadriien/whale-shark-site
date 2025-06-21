import React, { useState } from "react";
import { extractContinents } from "../utils/DataUtils.js";

function SharkSelector({ sharks, onReset, onSelect, selectedSharkId }) {
    // Track which continents are expanded & group sharks by continent
    const [openContinents, setOpenContinents] = useState({});
    const sharksByContinent = {};

    sharks.forEach(shark => {
        const continents = extractContinents(shark.continent); 

        // Handle sharks associated with multiple continents
        continents.forEach(continent => {
            if (!sharksByContinent[continent]) {
                sharksByContinent[continent] = [];
            }
            sharksByContinent[continent].push(shark);
        });
    });

    const toggleContinent = (continent) => {
        setOpenContinents(prev => ({
            ...prev,
            [continent]: !prev[continent],
        }));
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }} >
            <button 
                onClick={onReset}
                className={selectedSharkId == null ? "active" : ""}
            >
                <span className="all-sharks-button-text">Show All Sharks</span>
            </button>

            <div className="shark-selector-list">
                {Object.entries(sharksByContinent).map(([continent, sharks]) => {
                    const isOpen = openContinents[continent];
                    
                    return (  
                        <div key={continent} className="continent-dropdown">
                            <div
                                className="continent-header"
                                onClick={() => toggleContinent(continent)}
                            >
                                {continent} {isOpen ? "▾" : "▸"}
                            </div>
                            {isOpen && (
                                <div className="continent-shark-list">
                                    {sharks.map((shark) => (
                                        <div
                                            key={shark.id}
                                            className={`shark-selector-item ${shark.id === selectedSharkId ? "selected" : ""}`}
                                            onClick={() => onSelect(shark.id)}
                                        >
                                            {shark.id}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default SharkSelector;
