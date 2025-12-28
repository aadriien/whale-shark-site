import { useEffect, useRef, useState, useMemo } from "react";

import Globe from "../components/Globe.jsx";
import SharkInfoPanel from "../components/panels/SharkInfoPanel.jsx";
import SharkSelector from "../components/panels/SharkSelector.jsx";
import ContinentDisplay from "../components/panels/ContinentSharksDisplay";

import { addPointsData, clearAllData } from "../utils/GlobeUtils.js";
import { getGroupCoordinates } from "../utils/CoordinateUtils.js";
import { useGlobeClick } from "../utils/GlobeClick.jsx";
import { mediaSharks } from "../utils/DataUtils";


function GlobeViews() {
    const [selectedShark, setSelectedShark] = useState(null);
    const [allSharksVisible, setAllSharksVisible] = useState(true);
    const [filteredSharks, setFilteredSharks] = useState(mediaSharks); // track filtered sharks
    const globeRef = useRef();
    
    // Get coordinates for filtered sharks only
    const filteredPointsData = useMemo(() => {
        // Always use getGroupCoordinates to ensure consistency between sharks and coordinates
        const filteredSharkIds = filteredSharks.map(shark => shark.id);
        return getGroupCoordinates(filteredSharkIds);
    }, [filteredSharks]);
    
    const sharks = mediaSharks;
    
    useEffect(() => {
        // Show filtered sharks if nothing selected
        if (!selectedShark) {
            if (globeRef.current) {
                const globeInstance = globeRef.current.getGlobe();
                clearAllData(globeInstance);
                addPointsData(globeInstance, filteredPointsData);
            }
            setAllSharksVisible(true);
        } 
        else {
            // When shark selected, clear points & show rings for individual
            if (globeRef.current) {
                const globeInstance = globeRef.current.getGlobe();
                clearAllData(globeInstance); // Clear both points & rings
                globeRef.current.highlightShark(selectedShark.id);
            }
            setAllSharksVisible(false);
        }
    }, [selectedShark, filteredPointsData]);
    
    // Initial setup to show sharks on mount
    useEffect(() => {
        if (globeRef.current) {
            const globeInstance = globeRef.current.getGlobe();
            clearAllData(globeInstance);
            addPointsData(globeInstance, filteredPointsData);
        }
    }, [filteredPointsData]);
    
    // Direct call to useGlobeClick (with filtered sharks)
    const handleSelectShark = useGlobeClick({
        sharks: filteredSharks,
        pointsData: filteredPointsData, 
        allSharksVisible: !selectedShark,
        onSharkSelect: setSelectedShark
    });
      
    const handleReset = () => {
        setSelectedShark(null);
        setAllSharksVisible(true);
    };
    
    
    return (
        <div className="page-content globeviews-wrapper">
            {/* <h1>GlobeViews Page</h1> */}
            
            <div className="globe-views-container">

                {/* Shark info panel on left */}
                <div className="info-sidebar" >
                    <SharkInfoPanel shark={selectedShark} />
                </div>
                
                {/* Globe component */}
                <div className="globe-container">
                    <Globe 
                        ref={globeRef} 
                        onSharkClick={handleSelectShark} 
                        allowClicks={!selectedShark}
                    />
                </div>
                
                {/* Shark selector dropdown on right */}
                <div className="shark-selector">
                    <SharkSelector
                        sharks={sharks}
                        onSelect={handleSelectShark}
                        onReset={handleReset}
                        selectedSharkId={selectedShark ? selectedShark.id : null}
                        DisplayComponent={ContinentDisplay}
                        onFilteredSharksChange={setFilteredSharks}
                    />
                </div>

            </div>

        </div>
    );
}
    
export default GlobeViews;

    