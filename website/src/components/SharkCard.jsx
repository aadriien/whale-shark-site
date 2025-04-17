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
        <h2 className="shark-name">{shark.name}</h2>
        <p className="shark-id">ID: {shark.id}</p>

        {/* Play Story button */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent toggling expand
            onPlayStory(shark.id);
          }}
          disabled={isPlaying}  // Disable if a story is already playing
        >
          {isPlaying ? "Story in Progress..." : `Play ${shark.name}'s Story`}
        </button>

      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="shark-card-details">
          <p>Additional details about shark here...</p>
        </div>
      )}
    </div>
  );
};

export default SharkCard;
