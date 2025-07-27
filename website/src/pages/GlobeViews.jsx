import { useEffect, useRef, useState, useMemo } from "react";

import Globe from "../components/Globe.jsx";
import SharkInfoPanel from "../components/SharkInfoPanel.jsx";
import SharkSelector from "../components/SharkSelector.jsx";

import { addRingsDataStatic, clearRingsData } from "../utils/GlobeUtils.js";
import { getAllCoordinates } from "../utils/CoordinateUtils.js";
import { mediaSharks } from "../utils/DataUtils.js";


function GlobeViews() {
    const [selectedShark, setSelectedShark] = useState(null);
    const [allSharksVisible, setAllSharksVisible] = useState(true);
    const globeRef = useRef();

    const pointsData = useMemo(() => getAllCoordinates(), []);
    
    const sharks = mediaSharks;
    
    useEffect(() => {
        // Show all sharks if nothing selected
        if (!selectedShark) {
            if (globeRef.current) {
                const globeInstance = globeRef.current.getGlobe();
                clearRingsData(globeInstance);
                addRingsDataStatic(globeInstance, pointsData);
            }
            setAllSharksVisible(true);
        } 
        else {
            // When shark selected, highlight it via globe's method
            globeRef.current?.highlightShark(selectedShark.id);
            setAllSharksVisible(false);
        }
    }, [selectedShark]);
    
    // Initial setup to show all sharks on mount
    useEffect(() => {
        if (globeRef.current) {
            const globeInstance = globeRef.current.getGlobe();
            clearRingsData(globeInstance);
            addRingsDataStatic(globeInstance, pointsData);
        }
    }, []);
    
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
            const found = pointsData.find(s => {
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
                    />
                </div>

            </div>

        </div>
    );
}
    
export default GlobeViews;

    