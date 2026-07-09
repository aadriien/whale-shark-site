import React from "react";
import { useState, useEffect } from "react";

import { getSharkStoryCoordinates } from "../../utils/CoordinateUtils";

import { PlottedCoordinatePoint } from "../../types/coordinates";
import { StoryStepSliderProps } from "../../types/controls";

const StoryStepSlider = ({
    shark,
    onStepChange,
    currentStepIndex,
    isVisible,
    sharkIds,
}: StoryStepSliderProps) => {
    const [storyData, setStoryData] = useState<PlottedCoordinatePoint[]>([]);

    useEffect(() => {
        if (shark) {
            const ids = sharkIds && sharkIds.length > 0 ? sharkIds : [shark.id];
            const coordinates = getSharkStoryCoordinates(ids);
            setStoryData(coordinates);

            // Sync the first point immediately when data loads
            if (isVisible && coordinates.length > 0) {
                onStepChange(0, coordinates[0]);
            }
        }
    }, [shark, sharkIds, isVisible, onStepChange]);

    if (!isVisible || !shark || storyData.length === 0) return null;

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                        <span className="step-date-header">
                            {" "}
                            ... {currentPoint.date || "Unknown date"}
                        </span>
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
