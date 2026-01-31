import { useState, useEffect } from "react";

import { getSharkCoordinates } from "../../utils/CoordinateUtils";


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
    
    const handlePrevious = () => {
        if (currentStepIndex > 0) {
            const newIndex = currentStepIndex - 1;
            onStepChange(newIndex, storyData[newIndex]);
        }
    };
    
    const handleNext = () => {
        if (currentStepIndex < storyData.length - 1) {
            const newIndex = currentStepIndex + 1;
            onStepChange(newIndex, storyData[newIndex]);
        }
    };

    const currentPoint = storyData[currentStepIndex];

    return (
        <div className="story-step-container">
            <div className="story-slider-section">
                <h4>
                    Point {currentStepIndex + 1} of {storyData.length}
                    {currentPoint && (
                        <span className="step-date-header"> ... {currentPoint.date || "Unknown date"}</span>
                    )}
                </h4>
                
                <div className="slider-controls">
                    <button 
                        className="step-button" 
                        onClick={handlePrevious} 
                        disabled={currentStepIndex === 0}
                    >
                        -
                    </button>
                    
                    <input
                        type="range"
                        min="0"
                        max={storyData.length - 1}
                        value={currentStepIndex}
                        onChange={handleSliderChange}
                        className="story-slider"
                    />
                    
                    <button 
                        className="step-button" 
                        onClick={handleNext} 
                        disabled={currentStepIndex === storyData.length - 1}
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StoryStepSlider;
  
