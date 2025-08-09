import React, { useState } from "react";

import { toggleFavorite, isFavorite } from "../utils/FavoritesUtils.js";


const SharkCard = ({ shark, onPlayStory, isPlaying, playingSharkId }) => {
    // Purely for forcing re-render on shark favoriting / saving
    const [_, forceRender] = useState({}); 

    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div 
            className={`shark-card
                ${playingSharkId === shark.id && isPlaying ? " currentlyPlaying" : ""}
                ${isPlaying ? " anyPlaying" : ""}
                ${isExpanded ? " expanded" : ""}
            `}
            onClick={toggleExpand}
        >
            <div className="shark-country-tags">
                {Array.from(
                    new Set(
                        // Extract only unique countries as tags (no year)
                        shark.countries
                            .split(',')
                            .map((entry) => entry.trim().split(' (')[0]) 
                    )
                ).map((country) => (
                    <span key={country} className="country-tag">
                        {country}
                    </span>
                ))}
            </div>

            <div className="shark-card-image">
                {shark.cartoonImageURL ? (
                    <img src={shark.cartoonImageURL} alt={`LLM-generated cartoon image of whale shark named ${shark.name}`} />
                ) : (
                    <span>Shark Image</span> /* Placeholder text */
                )}
            </div>

            <div className="shark-card-content">
                {/* Play Story button */}
                <button
                    className={`play-story-button
                        ${playingSharkId === shark.id && isPlaying ? " currentlyPlaying" : ""}
                        ${isPlaying ? " anyPlaying" : ""}
                    `}
                    onClick={(e) => {
                        e.stopPropagation();
                        onPlayStory(shark.id);
                    }}
                    disabled={isPlaying}
                >
                    {isPlaying ? (
                        "Story in Progress..."
                    ) : (
                        <>
                        Play <strong>{shark.name}</strong>'s Story
                        </>
                    )}
                </button> 
            </div>

        {/* Expandable content */}
        {isExpanded && (
            <div className="shark-card-details">

                <h2 className="shark-id">
                    ID:&nbsp; {shark.id}
                    <button
                        className="favorite-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            const updated = toggleFavorite(shark.id);

                            // Force re-render to make UI update immediately
                            forceRender({});
                        }}
                    >
                        {isFavorite(shark.id) ? "★" : "☆"}
                    </button>
                </h2>

                <div className="shark-nicknames">
                    <h3 className="shark-name">LLM-generated nicknames</h3>
                    <p className="shark-details"><strong>OpenAI:</strong>&nbsp; {shark.name}</p>
                    <p className="shark-details"><strong>Gemma:</strong>&nbsp; {shark.gemmaName}</p>
                </div>

                <div className="shark-traits">
                    <p className="shark-details"><strong>Sex:</strong>&nbsp; {shark.sex}</p>
                    <p className="shark-details"><strong>Life Stage:</strong>&nbsp; {shark.lifeStage}</p>
                </div>

                <div className="shark-records">
                    <h3 className="shark-details"><strong>Total Records:</strong>&nbsp; {shark.occurrences}</h3>
                    <p className="shark-details">
                        {shark.oldest} &nbsp;...&nbsp; {shark.newest}
                    </p>
                    <p className="shark-details">
                        <strong>Satellite tracking:</strong>&nbsp;&nbsp;
                        {Math.round(
                            (shark.machine / (shark.machine + shark.human)
                        ) * 100)}%
                    </p>
                    <p className="shark-details">
                        <strong>Human sightings:</strong>&nbsp;&nbsp;
                        {Math.round(
                            (shark.human / (shark.machine + shark.human)
                        ) * 100)}%
                    </p>
                </div>

                <div className="shark-regions">
                    <h3 className="shark-details">Places Visited</h3>
                    <ul className="timeline-list">
                        {shark.countries.split(",").map((country, index) => (
                            <li key={index} className="timeline-item">{country}</li>
                        ))}
                    </ul>
                </div>

            </div>
        )}
        </div>
    );
};

export default SharkCard;
