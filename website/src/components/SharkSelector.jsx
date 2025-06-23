import React, { useState } from "react";

import { extractContinents, getCountryCode, parseSpecificRegion } from "../utils/DataUtils.js";

const VALID_CONTINENTS = new Set([
    "Africa",
    "Antarctica",
    "Asia",
    "Europe",
    "North America",
    "Oceania",
    "South America",
]);

function SharkSelector({ sharks, onReset, onSelect, selectedSharkId }) {
    // Track which continents are expanded & group sharks by continent
    const [openContinents, setOpenContinents] = useState({});
    const sharksByContinent = {};

    // Filter sharks by media presence if toggle is on
    const [showOnlyWithMedia, setShowOnlyWithMedia] = useState(false);
    const filteredSharks = showOnlyWithMedia
        ? sharks.filter(shark => shark.image && shark.image !== "Unknown" && shark.image.trim() !== "")
        : sharks;


    filteredSharks.forEach(shark => {
        const continents = extractContinents(shark.continent); 

        // Handle sharks associated with multiple continents
        continents.forEach(continent => {
            if (VALID_CONTINENTS.has(continent)) {
                if (!sharksByContinent[continent]) {
                    sharksByContinent[continent] = [];
                }
                sharksByContinent[continent].push(shark);
            }
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
                <div className="media-toggle-container">
                    {/* Checkbox toggle for showing only sharks with media */}
                    <label style={{ margin: "0.5rem 0 1rem", fontSize: "0.9rem", cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={showOnlyWithMedia}
                            onChange={() => setShowOnlyWithMedia(!showOnlyWithMedia)}
                            style={{ marginRight: "0.5rem" }}
                        />
                        Show only sharks with <strong>MEDIA</strong>
                    </label>
                </div>

                <div className="scrollable-sharks-list">
                    {Object.entries(sharksByContinent)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([continent, sharks]) => {
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
                                                {(() => {
                                                    const countryName = parseSpecificRegion(shark.countries.trim());
                                                    const code = getCountryCode(countryName);

                                                    return (
                                                        <>
                                                        {code ? (
                                                            <div className="flag-and-code">
                                                                <img
                                                                    src={`https://flagcdn.com/24x18/${code}.png`}
                                                                    alt={countryName}
                                                                    title={countryName}
                                                                    className="flag-icon"
                                                                    loading="lazy"
                                                                />
                                                                <span className="country-code">{code.toUpperCase()}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="flag-and-code" title={countryName} role="img" aria-label="unknown country">
                                                                🌍 <span className="country-code">N/A</span>
                                                            </span>
                                                        )}
                                                        {shark.id}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default SharkSelector;
