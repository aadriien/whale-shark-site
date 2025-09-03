import { useEffect, useRef, useState, useMemo, useCallback } from "react";

import Globe from "../components/Globe.jsx";
import PlayStoryButton from "../components/PlayStoryButton.jsx";
import StoryStepSlider from "../components/StoryStepSlider.jsx";

import SharkInfoPanel from "../components/SharkInfoPanel.jsx";
import SharkSelector from "../components/SharkSelector.jsx";
import SavedDisplay from "../components/SavedSharksDisplay.jsx";

import { addPointsData, clearAllData } from "../utils/GlobeUtils.js";
import { getFavorites, getSavedSharkIds } from "../utils/FavoritesUtils.js";
import { getGroupCoordinates, getSharkCoordinates } from "../utils/CoordinateUtils.js";
import { mediaSharks } from "../utils/DataUtils.js";


function GeoLabs() {
    const [selectedShark, setSelectedShark] = useState(null);
    const [allSharksVisible, setAllSharksVisible] = useState(true);
    
    const [savedIds, setSavedIds] = useState(new Set());
    const [viewMode, setViewMode] = useState('multiple'); // 'individual' or 'multiple'
    
    const [selectedSharksForLab, setSelectedSharksForLab] = useState(new Set()); // for multi-select mode

    // Step-through story functionality
    const [isStepMode, setIsStepMode] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [currentPoint, setCurrentPoint] = useState(null);
    const globeRef = useRef();

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

    // Get coordinates for saved sharks only
    const pointsData = useMemo(() => {
        const savedSharkIds = getSavedSharkIds();
        console.log('Plotting saved sharks on globe:', savedSharkIds);
        return getGroupCoordinates(savedSharkIds);
    }, [savedIds]);
    
    // Get coordinates for selected lab sharks (multi-select mode)
    const selectedLabPointsData = useMemo(() => {
        if (selectedSharksForLab.size === 0) return [];
        const labSharkIds = Array.from(selectedSharksForLab);

        console.log('Plotting selected lab sharks on globe:', labSharkIds);
        return getGroupCoordinates(labSharkIds);
    }, [selectedSharksForLab]);
    
    const sharks = mediaSharks;
    
    useEffect(() => {
        if (!globeRef.current) return;
        
        const globeInstance = globeRef.current.getGlobe();
        clearAllData(globeInstance);
        
        // Nothing plotted during step mode 
        if (isStepMode) {
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
            } else {
                // No lab sharks selected, show all saved sharks (default state)
                addPointsData(globeInstance, pointsData);
                setAllSharksVisible(true);
            }
        }
    }, [viewMode, selectedShark, pointsData, selectedLabPointsData, isStepMode]);
    
    // Handle shark selection from dropdown or globe click
    const handleSelectShark = (arg) => {
        // Check if arg is object (from globe click) or string (from dropdown)
        if (typeof arg === "object" && arg.lat !== undefined && arg.lng !== undefined) {
            if (!allSharksVisible) {
                console.log("Ignoring click because not all sharks are visible.");
                return;
            }
            
            const { lat, lng } = arg;
            console.log("Clicked at lat/lng:", lat, lng);
    
            const tolerance = 3.0;
      
            const currentPointsData = viewMode === 'multiple' && selectedSharksForLab.size > 0 
                ? selectedLabPointsData 
                : pointsData;
                
            const found = currentPointsData.find(s => {
                const dLat = Math.abs(s.lat - lat);
                const dLng = Math.abs(s.lng - lng);

                return dLat < tolerance && dLng < tolerance;
            });
    
            if (found) {
                const cleanID = found.id.split("-")[0];
                console.log("Matched shark:", found.id, " with ID: ", cleanID);

                // Using "==" instead of "===" in case different types for ID
                const foundShark = sharks.find(shark => shark.id == cleanID) || null;

                console.log("Sending shark obect:", foundShark);
                setSelectedShark(foundShark);
            } 
            else {
                console.log("No nearby shark found.");
                setSelectedShark(null);
            }
        } 
        else {
            // Coming from dropdown (arg = sharkId or null)
            const foundShark = sharks.find(shark => shark.id == arg) || null;
            setSelectedShark(foundShark);
        }
    };
      
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
        } else {
            // Enter step mode
            setIsStepMode(true);
            setCurrentStepIndex(0);
            
            // Clear current points and prepare for step-through
            if (globeRef.current) {
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
        } else {
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
        
        // Clear globe & reset to default state
        if (globeRef.current) {
            const globeInstance = globeRef.current.getGlobe();
            clearAllData(globeInstance);
            // Points will be replotted by main useEffect
        }
        
        // Switch mode
        setViewMode(prev => prev === 'individual' ? 'multiple' : 'individual');
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
                    
                    {/* Multi-select info panel */}
                    {viewMode === 'multiple' && (
                        <div className="multi-select-info">
                            <div className="multi-select-header">
                                <h4>Selected for Lab ({selectedSharksForLab.size}):</h4>
                                <label className="select-all-container">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedSharksForLab.size > 0 && Array.from(savedIds).every(id => selectedSharksForLab.has(id))}
                                        onChange={handleSelectAllToggle}
                                        className="select-all-checkbox"
                                    />
                                    Add all saved whale sharks
                                </label>
                            </div>
                            <div className="selected-sharks-list">
                                {selectedSharksForLab.size > 0 
                                    ? Array.from(selectedSharksForLab).join(', ') 
                                    : 'None in lab'
                                }
                            </div>
                        </div>
                    )}
                    
                    <SharkInfoPanel shark={selectedShark} />
                </div>
                
                {/* Globe component */}
                <div className="globe-container">
                    <Globe 
                        ref={globeRef} 
                        onSharkClick={handleSelectShark} 
                        allowClicks={!selectedShark}
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
                        disabled={isStepMode} // Disable selector while in step mode
                    />
                </div>

            </div>

        </div>
    );
}
    
export default GeoLabs;

    