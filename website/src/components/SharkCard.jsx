import React, { useState } from "react";

const SharkCard = ({ shark, onPlayStory, isPlaying }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="shark-card" onClick={toggleExpand}>
      <div className="shark-card-image">
        <span>Shark Image</span> {/* Placeholder text */}
      </div>
      <div className="shark-card-content">

        {/* Play Story button */}
        <button
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

            <h2 className="shark-name">Name: {shark.name}</h2>
            <p className="shark-id">ID: {shark.id}</p>
            
            <p>Additional details about shark here...</p>
        </div>
      )}
    </div>
  );
};

export default SharkCard;
