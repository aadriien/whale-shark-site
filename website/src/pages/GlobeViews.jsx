import { useEffect, useRef, useState } from "react";

import Globe from "../components/Globe.jsx";
import SharkInfoPanel from "../components/SharkInfoPanel.jsx";
import SharkSelector from "../components/SharkSelector.jsx";

import { getAllCoordinates } from "../utils/CoordinateUtils.js";
import { addRingsData, addRingsDataStatic, clearRingsData } from "../utils/GlobeUtils.js";
import { storySharks } from "../utils/DataUtils.js";


function GlobeViews() {
    const [selectedSharkId, setSelectedSharkId] = useState(null);
    const globeRef = useRef();

    const sharks = storySharks;

    useEffect(() => {
        if (!selectedSharkId) {
          // Show all sharks if nothing selected
          if (globeRef.current) {
            const globeInstance = globeRef.current.getGlobe();
            clearRingsData(globeInstance);
            const pointsData = getAllCoordinates();
            addRingsDataStatic(globeInstance, pointsData);
          }
        } else {
          // Highlight selected shark
          globeRef.current?.highlightShark(selectedSharkId);
        }
    }, [selectedSharkId]);

    const handleSelectShark = (sharkId) => {
        setSelectedSharkId(sharkId);
    };
    
    const handleReset = () => {
        setSelectedSharkId(null);
    };
    
    // Initial load: plot all sharks on mount
    useEffect(() => {
        if (globeRef.current) {
          const globeInstance = globeRef.current.getGlobe();
          clearRingsData(globeInstance);
          const pointsData = getAllCoordinates();
          addRingsDataStatic(globeInstance, pointsData);
        }
    }, []);

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "stretch",
            height: "100vh",
            overflowY: "auto",
            textAlign: "center",
            paddingTop: "60px"
        }}>
            <h1>GlobeViews Page</h1>
            <p>Here's where we'll visualize globe data.</p>

            <div className="globe-views-container">
                {/* Shark info panel on left */}
                <div className="info-sidebar">
                    <SharkInfoPanel />
                </div>

                {/* Globe component */}
                <div className="globe-container">
                    <Globe ref={globeRef} />
                </div>

                {/* Holistic view button + shark dropdown on right */}
                <div className="shark-selector">
                    <SharkSelector sharks={sharks} onSelect={handleSelectShark} onReset={handleReset} selectedSharkId={selectedSharkId} />
                </div>

            </div>

        </div>
    );
}
  
export default GlobeViews;
  

