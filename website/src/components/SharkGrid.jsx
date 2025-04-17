import React from "react";
import SharkCard from "./SharkCard";

const SharkGrid = ({ sharks, onPlayStory, isPlaying }) => {
  return (
    <div className="shark-grid">
      {sharks.map((shark) => (
        <SharkCard 
            key={shark.id} shark={shark} 
            onPlayStory={onPlayStory} isPlaying={isPlaying} 
        />
      ))}
    </div>
  );
};

export default SharkGrid;
