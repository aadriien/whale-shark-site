import React, { useState, useEffect, useMemo } from "react";
import coordinatesData from '../assets/data/json/gbif_shark_tracking.json';


const TimelineSelector = ({ 
    onTimelineChange, 
    currentMonth, currentYear, 
    isVisible, 
    availableSharks = [] 
}) => {
    // Get all available month-year combinations from sharks in lab
    const getAvailableMonthYears = () => {
        const monthYears = new Set();
        
        coordinatesData.forEach(sharkDict => {
            // Only include sharks in available list
            if (availableSharks.length === 0 || availableSharks.includes(sharkDict.whaleSharkID)) {
                sharkDict.coordinates.forEach(coord => {
                    if (coord.parsedDate) {
                        const date = new Date(coord.parsedDate);
                        const year = date.getFullYear();
                        const month = date.getMonth() + 1;

                        if (!isNaN(year) && !isNaN(month)) {
                            monthYears.add(`${year}-${month.toString().padStart(2, '0')}`);
                        }
                    }
                });
            }
        });
        return Array.from(monthYears).sort();
    };
    
    const availableMonthYears = useMemo(() => getAvailableMonthYears(), [availableSharks]);
    
    // Initialize with first available date or current date
    const getInitialIndex = () => {
        if (availableMonthYears.length === 0) return 0;
        
        const currentKey = `${
            currentYear || 
            new Date().getFullYear()}-${(currentMonth || 
            new Date().getMonth() + 1).toString().padStart(2, '0')
        }`;
        
        const index = availableMonthYears.indexOf(currentKey);
        return index >= 0 ? index : 0;
    };
    
    const [sliderIndex, setSliderIndex] = useState(getInitialIndex);
    
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Get current month & year from slider index
    const getCurrentMonthYear = (index) => {
        if (availableMonthYears.length === 0) return { month: 1, year: new Date().getFullYear() };
        
        const monthYearStr = availableMonthYears[index] || availableMonthYears[0];
        const [year, month] = monthYearStr.split('-').map(Number);
        return { month, year };
    };
    
    const currentMonthYear = getCurrentMonthYear(sliderIndex);

    useEffect(() => {
        if (isVisible && availableMonthYears.length > 0) {
            const { month, year } = currentMonthYear;
            onTimelineChange(month, year);
        }
    }, [sliderIndex, isVisible, onTimelineChange, availableMonthYears.length]);

    if (!isVisible || availableMonthYears.length === 0) return null;

    const handleSliderChange = (e) => {
        const newIndex = parseInt(e.target.value);
        setSliderIndex(newIndex);
    };

    const handlePrevMonth = () => {
        if (sliderIndex > 0) {
            setSliderIndex(sliderIndex - 1);
        }
    };

    const handleNextMonth = () => {
        if (sliderIndex < availableMonthYears.length - 1) {
            setSliderIndex(sliderIndex + 1);
        }
    };

    const canGoPrev = sliderIndex > 0;
    const canGoNext = sliderIndex < availableMonthYears.length - 1;

    return (
        <div className="timeline-selector-container">
            <div className="timeline-controls">
                <h4>Timeline Filter</h4>
                
                <div className="timeline-navigation">
                    <button 
                        className="timeline-nav-button" 
                        onClick={handlePrevMonth}
                        disabled={!canGoPrev}
                        title="Previous month"
                    >
                        ←
                    </button>
                    
                    <div className="timeline-date-display">
                        {months[currentMonthYear.month - 1]} {currentMonthYear.year}
                    </div>
                    
                    <button 
                        className="timeline-nav-button" 
                        onClick={handleNextMonth}
                        disabled={!canGoNext}
                        title="Next month"
                    >
                        →
                    </button>
                </div>
                
                <div className="timeline-slider-section">
                    <input
                        type="range"
                        min="0"
                        max={availableMonthYears.length - 1}
                        value={sliderIndex}
                        onChange={handleSliderChange}
                        className="timeline-slider"
                    />
                </div>
                
                <div className="timeline-info">
                    Showing coordinates from {months[currentMonthYear.month - 1]} {currentMonthYear.year}
                </div>
            </div>
        </div>
    );
};

export default TimelineSelector;

