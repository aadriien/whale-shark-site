import { useEffect, useRef, useState } from "react";

import Globe from "../components/Globe.jsx";
import SharkInfoPanel from "../components/SharkInfoPanel.jsx";
import SharkSelector from "../components/SharkSelector.jsx";

import { addRingsDataStatic, clearRingsData } from "../utils/GlobeUtils.js";
import { getAllCoordinates } from "../utils/CoordinateUtils.js";
import { mediaSharks } from "../utils/DataUtils.js";


function GlobeViews() {
    const [selectedShark, setSelectedShark] = useState(null);
    const globeRef = useRef();

    const pointsData = getAllCoordinates();
    
    const sharks = mediaSharks;
    
    useEffect(() => {
        // Show all sharks if nothing selected
        if (!selectedShark) {
            if (globeRef.current) {
                const globeInstance = globeRef.current.getGlobe();
                clearRingsData(globeInstance);
                addRingsDataStatic(globeInstance, pointsData);
            }
        } else {
            // When shark selected, highlight it via globe's method
            globeRef.current?.highlightShark(selectedShark.id);
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
    const handleSelectShark = ({ lat, lng }) => {
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
    };
      
    const handleReset = () => {
        setSelectedShark(null);
    };
    
    
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            overflowY: "auto",
            textAlign: "center",
            paddingTop: "60px"
        }}>
            <h1>GlobeViews Page</h1>
            
            <div className="globe-views-container">

                {/* Shark info panel on left */}
                <div className="info-sidebar" >
                    <SharkInfoPanel shark={selectedShark} onReset={handleReset} />
                </div>
                
                {/* Globe component */}
                <div className="globe-container">
                    <Globe ref={globeRef} onSharkClick={handleSelectShark} />
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

    