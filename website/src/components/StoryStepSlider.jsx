import React, { useState, useEffect } from "react";
import { getSharkCoordinates } from "../utils/CoordinateUtils.js";


const StoryStepSlider = ({ shark, onStepChange, currentStepIndex, isVisible }) => {
    const [storyData, setStoryData] = useState([]);
    
    useEffect(() => {
        if (shark) {
            const coordinates = getSharkCoordinates(shark.id);
            setStoryData(coordinates);
            
            // Handle single data point case immediately when data loads
            if (isVisible && coordinates.length === 1) {
                onStepChange(0, coordinates[0]);
            }
        }
    }, [shark, isVisible, onStepChange]);

    if (!isVisible || !shark || storyData.length === 0) return null;

    const handleSliderChange = (e) => {
        const stepIndex = parseInt(e.target.value);
        const point = storyData[stepIndex];
        onStepChange(stepIndex, point);
    };

    const currentPoint = storyData[currentStepIndex];

    return (
        <div className="story-step-container">
            <div className="story-slider-section">
                <h4>Timeline: {shark.name || shark.id}</h4>
                <input
                    type="range"
                    min="0"
                    max={storyData.length - 1}
                    value={currentStepIndex}
                    onChange={handleSliderChange}
                    className="story-slider"
                />
                <div className="step-info">
                    <span>Point {currentStepIndex + 1} of {storyData.length} </span>
                    {currentPoint && (
                        <span className="step-date">
                            ... {currentPoint.date || "Unknown date"}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StoryStepSlider;
  
