import { useEffect, useRef, useState, useMemo, useCallback } from "react";

import Globe from "../components/Globe.jsx";
import PlayStoryButton from "../components/controls/PlayStoryButton.jsx";
import StoryStepSlider from "../components/controls/StoryStepSlider.jsx";
import TimelineControls from "../components/controls/TimelineControls.jsx";

import SharkInfoPanel from "../components/panels/SharkInfoPanel.jsx";
import SharkSelector from "../components/panels/SharkSelector.jsx";
import SavedDisplay from "../components/panels/SavedSharksDisplay.jsx";
import LabSelectionPanel from "../components/panels/LabSelectionPanel.jsx";

import { addPointsData, clearAllData } from "../utils/GlobeUtils.js";
import { getFavorites, getSavedSharkIds } from "../utils/FavoritesUtils.js";
import { useGlobeClick } from "../utils/GlobeClick.jsx";

import { 
    getGroupCoordinates, 
    getSharkCoordinates, 
    getGroupCoordinatesByTimeline 
} from "../utils/CoordinateUtils.js";
import { mediaSharks } from "../utils/DataUtils.js";


function GeoLabs() {
    const [selectedShark, setSelectedShark] = useState(null);
    const [allSharksVisible, setAllSharksVisible] = useState(true);
    const [filteredSharks, setFilteredSharks] = useState(mediaSharks);
    
    const [savedIds, setSavedIds] = useState(new Set());
    const [viewMode, setViewMode] = useState('multiple'); // 'individual' or 'multiple'
    
    const [selectedSharksForLab, setSelectedSharksForLab] = useState(new Set()); // for multi-select mode

    // Step-through story functionality
    const [isStepMode, setIsStepMode] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [currentPoint, setCurrentPoint] = useState(null);
    const globeRef = useRef();
    
    // Timeline mode functionality
    const [isTimelineMode, setIsTimelineMode] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);

    const sharks = mediaSharks;

    // Update saved IDs when favorites change
    useEffect(() => {
        const updateSavedIds = () => {
            setSavedIds(getFavorites());
        };
        
        // Initial load
        updateSavedIds();
        
        // Listen for changes
        window.addEventListener('storage', updateSavedIds);
        window.addEventListener('favoritesChanged', updateSavedIds);
        
        return () => {
            window.removeEventListener('storage', updateSavedIds);
            window.removeEventListener('favoritesChanged', updateSavedIds);
        };
    }, []);

    // Get coordinates for saved sharks only (with any filters in place)
    const pointsData = useMemo(() => {
        const savedSharkIds = getSavedSharkIds();
        const filteredSharkIds = filteredSharks.map(shark => shark.id);

        // Remove duplicates from both arrays
        const uniqueSavedSharkIds = [...new Set(savedSharkIds)];
        const uniqueFilteredSharkIds = [...new Set(filteredSharkIds)];

        console.log('Unique sharks from saved IDs:', uniqueSavedSharkIds);
        console.log('Unique sharks from filtered IDs:', uniqueFilteredSharkIds);

        // Find intersection (common IDs) between both arrays
        const intersectionSavedFiltered = uniqueSavedSharkIds.filter(
            id => uniqueFilteredSharkIds.includes(id)
        );

        console.log('Plotting sharks on globe:', intersectionSavedFiltered);
        return getGroupCoordinates(intersectionSavedFiltered);
    }, [savedIds, filteredSharks]);
    
    // Get coordinates for selected lab sharks (multi-select mode)
    const selectedLabPointsData = useMemo(() => {
        if (selectedSharksForLab.size === 0) return [];
        const labSharkIds = Array.from(selectedSharksForLab);

        console.log('Plotting selected lab sharks on globe:', labSharkIds);
        
        // Use timeline filtering if timeline mode active
        if (isTimelineMode && selectedMonth && selectedYear) {
            return getGroupCoordinatesByTimeline(labSharkIds, selectedMonth, selectedYear);
        }
        
        return getGroupCoordinates(labSharkIds);
    }, [selectedSharksForLab, isTimelineMode, selectedMonth, selectedYear]);
    
    
    useEffect(() => {
        if (!globeRef.current) return;
        
        const globeInstance = globeRef.current.getGlobe();
        clearAllData(globeInstance);
        
        // Nothing plotted during step mode 
        if (isStepMode) {
            setAllSharksVisible(false);
            return;
        }
        
        // Nothing plotted during timeline mode initially 
        if (isTimelineMode) {
            setAllSharksVisible(false);
            return;
        }
        
        if (viewMode === 'individual') {
            if (selectedShark) {
                // Individual mode with shark selected - show only that shark's points
                globeRef.current.highlightShark(selectedShark.id, true);
                setAllSharksVisible(false);
            } 
            else {
                // Individual mode with no shark selected - show all saved sharks
                addPointsData(globeInstance, pointsData);
                setAllSharksVisible(true);
            }
        } 
        else {
            if (selectedSharksForLab.size > 0) {
                // Show only selected lab sharks
                addPointsData(globeInstance, selectedLabPointsData);
                setAllSharksVisible(true);
            } 
            else {
                // No lab sharks selected, show all saved sharks (default state)
                addPointsData(globeInstance, pointsData);
                setAllSharksVisible(true);
            }
        }
    }, [viewMode, selectedShark, pointsData, selectedLabPointsData, isStepMode]);
    
    // Leverage reusable globe click handler
    const handleSelectShark = useGlobeClick({
        sharks,
        pointsData,
        allSharksVisible,
        onSharkSelect: setSelectedShark
    });
      
    const handleReset = () => {
        setSelectedShark(null);
        setAllSharksVisible(true);
    };
    
    const handleToggleStepMode = () => {
        if (isStepMode) {
            // Exit step mode, i.e. clear data & re-enable controls (no reorientation needed)
            setIsStepMode(false);
            setCurrentStepIndex(0);
            setCurrentPoint(null);
            
            if (globeRef.current) {
                const globeInstance = globeRef.current.getGlobe();
                clearAllData(globeInstance);
                
                globeRef.current.enableControls();
                
                // Show static points for selected shark without reorienting
                if (selectedShark) {
                    const coordinates = getSharkCoordinates(selectedShark.id);
                    addPointsData(globeInstance, coordinates);
                }
            }
        } 
        else {
            // Enter step mode
            setIsStepMode(true);
            setCurrentStepIndex(0);
            
            if (globeRef.current && selectedShark) {
                // Disable controls, clear points, & prepare for step mode
                globeRef.current.disableControls();
                
                const globeInstance = globeRef.current.getGlobe();
                clearAllData(globeInstance);
            }
        }
    };
    
    const handleStepChange = useCallback((stepIndex, point) => {
        setCurrentStepIndex(stepIndex);
        setCurrentPoint(point);
        
        if (globeRef.current && point) {
            globeRef.current.showSinglePoint(point);
        }
    }, []); // No dependencies since using refs & state setters
    
    const handleSelectAllToggle = () => {
        if (selectedSharksForLab.size > 0 && Array.from(savedIds).every(id => selectedSharksForLab.has(id))) {
            // All saved sharks are selected, so clear selection
            setSelectedSharksForLab(new Set());
        } 
        else {
            // Not all saved sharks are selected, so select all
            setSelectedSharksForLab(new Set(savedIds));
        }
    };
    
    const handleToggleViewMode = () => {
        // Complete reset when switching view modes
        setSelectedShark(null);
        setSelectedSharksForLab(new Set());
        setAllSharksVisible(true);
        
        // Exit step mode if active
        if (isStepMode) {
            setIsStepMode(false);
            setCurrentStepIndex(0);
            setCurrentPoint(null);
            
            if (globeRef.current) {
                globeRef.current.enableControls();
            }
        }
        
        // Exit timeline mode if active
        if (isTimelineMode) {
            setIsTimelineMode(false);
            setSelectedMonth(null);
            setSelectedYear(null);
        }
        
        // Clear globe & reset to default state
        if (globeRef.current) {
            const globeInstance = globeRef.current.getGlobe();
            clearAllData(globeInstance);
            // Points will be replotted by main useEffect
        }
        
        // Switch mode
        setViewMode(prev => prev === 'individual' ? 'multiple' : 'individual');
    };
    
    const handleToggleTimelineMode = () => {
        if (isTimelineMode) {
            // Exit timeline mode
            setIsTimelineMode(false);
            setSelectedMonth(null);
            setSelectedYear(null);
        } 
        else {
            // Enter timeline mode
            setIsTimelineMode(true);
        }
    };
    
    
    return (
        <div className="page-content globeviews-wrapper">
            {/* <h1>GeoLabs Page</h1> */}
            
            <div className="globe-views-container">

                {/* Shark info panel on left */}
                <div className="info-sidebar">
                    {/* View Mode Toggle Button */}
                    <button 
                        className={`view-mode-toggle ${viewMode}`}
                        onClick={handleToggleViewMode}
                    >
                        {viewMode === 'individual' 
                            ? 'Switch to Multi Shark View' 
                            : 'Switch to Single Shark View'
                        }
                    </button>
                    
                    {/* Step Through Story Controls */}
                    {selectedShark && (
                        <div className="story-controls-container">
                            <PlayStoryButton 
                                shark={selectedShark} 
                                onToggleStepMode={handleToggleStepMode}
                                isStepMode={isStepMode}
                                showPauseForGeoLabs={true}
                            />
                            
                            {/* Story step slider positioned below button */}
                            <StoryStepSlider 
                                shark={selectedShark}
                                onStepChange={handleStepChange}
                                currentStepIndex={currentStepIndex}
                                isVisible={isStepMode}
                            />
                        </div>
                    )}
                    
                    {/* Timeline Mode Controls shown in multiple view */}
                    {viewMode === 'multiple' && (
                        <TimelineControls 
                            globeRef={globeRef}
                            selectedSharksForLab={selectedSharksForLab}
                            onToggleTimelineMode={handleToggleTimelineMode}
                            isTimelineMode={isTimelineMode}
                        />
                    )}
                    
                    {viewMode === 'multiple' ? (
                        <div className="shark-info-panel">
                            <LabSelectionPanel 
                                selectedSharksForLab={selectedSharksForLab}
                                savedIds={savedIds}
                                sharks={sharks}
                                onSelectAllToggle={handleSelectAllToggle}
                            />
                        </div>
                    ) : (
                        <SharkInfoPanel shark={selectedShark} />
                    )}
                </div>
                
                {/* Globe component */}
                <div className="globe-container">
                    <Globe 
                        ref={globeRef} 
                        onSharkClick={handleSelectShark} 
                        allowClicks={viewMode === 'individual' && !selectedShark}
                    />
                    {/* Coordinate display to match SharkTracker positioning */}
                    {isStepMode && currentPoint && (
                        <div 
                            style={{
                                position: "absolute",
                                bottom: 10,
                                width: "100%",
                                textAlign: "center",
                                color: "white",
                                fontSize: "0.85rem",
                                fontFamily: "sans-serif",
                                padding: "2px 0",
                                backgroundColor: "rgba(0, 0, 0, 0)", 
                                textShadow: "0 0 8px rgba(0, 255, 255, 0.9)",
                                pointerEvents: "none",  
                                userSelect: "none",
                            }}
                        >
                            Lat: <span style={{ fontWeight: "bold" }}>{currentPoint.lat.toFixed(3)}</span>,{" "}
                            Lng: <span style={{ fontWeight: "bold" }}>{currentPoint.lng.toFixed(3)}</span> —{" "}
                            Date: <span style={{ fontWeight: "bold" }}>{currentPoint.date || "N/A"}</span>
                        </div>
                    )}
                </div>
                
                {/* Shark selector dropdown on right */}
                <div className="shark-selector">
                    <SharkSelector
                        sharks={sharks}
                        onSelect={handleSelectShark}
                        onReset={handleReset}
                        selectedSharkId={selectedShark ? selectedShark.id : null}
                        DisplayComponent={(props) => (
                            <SavedDisplay
                                {...props}
                                viewMode={viewMode}
                                selectedSharksForLab={selectedSharksForLab}
                                onLabSelectionChange={setSelectedSharksForLab}

                                // Disable onSelect in multiple mode
                                onSelect={viewMode === 'multiple' ? null : props.onSelect} 
                            />
                        )}
                        // Disable selector while in step or timeline mode
                        disabled={isStepMode || isTimelineMode}
                        
                        onFilteredSharksChange={setFilteredSharks}
                    />
                </div>

            </div>

        </div>
    );
}
    
export default GeoLabs;

    