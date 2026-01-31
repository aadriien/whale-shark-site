import { useState, useCallback } from "react";

import TimelineButton from "./TimelineButton";
import TimelineSelector from "./TimelineSelector";

import { getGroupCoordinatesByTimeline } from "../../utils/CoordinateUtils";
import { getSavedSharkIds } from "../../utils/FavoritesUtils";
import { addPointsData, clearAllData } from "../../utils/GlobeUtils.js";


const TimelineControls = ({ 
    globeRef, 
    selectedSharksForLab, 
    onToggleTimelineMode, 
    isTimelineMode,
    onTimelineStateChange 
}) => {
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);
    const [plottedCoordinates, setPlottedCoordinates] = useState([]);

    const handleToggleTimelineMode = () => {
        if (isTimelineMode) {
            // Exit timeline mode
            setSelectedMonth(null);
            setSelectedYear(null);
            setPlottedCoordinates([]);
        }
        onToggleTimelineMode();
        onTimelineStateChange?.(false);
    };

    const handleTimelineChange = useCallback((month, year) => {
        setSelectedMonth(month);
        setSelectedYear(year);
        console.log(`Timeline changed to: ${month}/${year}`);
        
        // Show filtered timeline data on globe
        if (globeRef.current && month && year) {
            const globeInstance = globeRef.current.getGlobe();
            clearAllData(globeInstance);
            
            const savedSharkIds = getSavedSharkIds();
            let dataToShow;
            
            if (selectedSharksForLab.size > 0) {
                // Selected lab sharks with timeline filtering
                dataToShow = getGroupCoordinatesByTimeline(Array.from(selectedSharksForLab), month, year);
            } 
            else {
                // All saved sharks with timeline filtering
                dataToShow = getGroupCoordinatesByTimeline(savedSharkIds, month, year);
            }
            
            // Store plotted coordinates for display in TimelineSelector
            setPlottedCoordinates(dataToShow);
            addPointsData(globeInstance, dataToShow);
        }
    }, [globeRef, selectedSharksForLab]);

    // Get available sharks for timeline range
    const getAvailableSharks = () => {
        if (selectedSharksForLab.size > 0) {
            return Array.from(selectedSharksForLab);
        }
        else {
            return getSavedSharkIds();
        }
    };

    return (
        <div className="timeline-controls-container">
            <TimelineButton 
                onToggleTimelineMode={handleToggleTimelineMode}
                isTimelineMode={isTimelineMode}
            />
            
            <TimelineSelector 
                onTimelineChange={handleTimelineChange}
                currentMonth={selectedMonth}
                currentYear={selectedYear}
                isVisible={isTimelineMode}
                availableSharks={getAvailableSharks()}
                plottedCoordinates={plottedCoordinates}
            />
        </div>
    );
};

export default TimelineControls;

