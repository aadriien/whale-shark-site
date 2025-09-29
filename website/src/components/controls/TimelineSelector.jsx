import React, { useState, useEffect, useMemo } from "react";

import { MONTHS } from "../../utils/DataUtils.js";

import coordinatesData from '../../assets/data/json/gbif_shark_tracking.json';


const TimelineSelector = ({ 
    onTimelineChange, 
    currentMonth, currentYear, 
    isVisible, 
    availableSharks = [],
    plottedCoordinates = []
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

    // Get current month & year from slider index
    const getCurrentMonthYear = (index) => {
        if (availableMonthYears.length === 0) return { month: 1, year: new Date().getFullYear() };
        
        const monthYearStr = availableMonthYears[index] || availableMonthYears[0];
        const [year, month] = monthYearStr.split('-').map(Number);
        return { month, year };
    };
    
    const currentMonthYear = getCurrentMonthYear(sliderIndex);
    
    // Extract unique shark IDs from plotted coordinates
    const plottedSharkIds = useMemo(() => {
        if (!plottedCoordinates || plottedCoordinates.length === 0) return [];
        
        const sharkIds = new Set();
        plottedCoordinates.forEach(coord => {
            if (coord.id) {
                // Extract shark ID from coordinate ID (format: "sharkID-lat-lng")
                const sharkId = coord.id.split('-')[0];
                sharkIds.add(sharkId);
            }
        });
        
        return Array.from(sharkIds).sort((a, b) => a.localeCompare(b));
    }, [plottedCoordinates]);

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
                    {MONTHS[currentMonthYear.month - 1]} {currentMonthYear.year}
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
                Showing map data from {MONTHS[currentMonthYear.month - 1]} {currentMonthYear.year}
            </div>
            
            {/* Display plotted shark IDs */}
            {plottedSharkIds.length > 0 && (
                <div className="timeline-sharks-display">
                    <div className="sharks-list-title">
                        Plotting {plottedSharkIds.length} whale shark{plottedSharkIds.length !== 1 ? 's' : ''}:
                    </div>
                    <div className="selected-sharks-list">
                        {Array.from(plottedSharkIds).join(', ')}
                    </div>
                </div>
            )}

        </div>
    );
};

export default TimelineSelector;

