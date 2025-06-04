import { useEffect, useRef } from "react";

import Globe from "../components/Globe.jsx";
import SharkInfoPanel from "../components/SharkInfoPanel.jsx";
import SharkSelector from "../components/SharkSelector.jsx";

import { getAllCoordinates, getSharkCoordinates } from "../utils/CoordinateUtils.js";
import { addRingsData, addRingsDataStatic, clearRingsData } from "../utils/GlobeUtils.js";
import { storySharks } from "../utils/DataUtils.js";


function GlobeViews() {
    const globeRef = useRef();

    const sharks = storySharks;

    const plotAllSharks = () => {
        console.log('Plotting all sharks');

        if (globeRef.current) {
            const globeInstance = globeRef.current.getGlobe();
            clearRingsData(globeInstance);
  
            // Populate all data on whole globe (NOT storytelling)
            const pointsData = getAllCoordinates();
            addRingsDataStatic(globeInstance, pointsData); 
        }
      };
    
    const plotSingleShark = (sharkID) => {
        if (globeRef.current) {
            const globeInstance = globeRef.current.getGlobe();
            clearRingsData(globeInstance);
  
            // Populate only that shark's globe data (NOT storytelling)
            const sharkPointsData = getSharkCoordinates(sharkID);
            addRingsData(globeInstance, sharkPointsData); 
        }
    };

    // useEffect(() => {
    //     if (globeRef.current) {
    //       const globeInstance = globeRef.current.getGlobe();

    //       // Populate all data on whole globe (NOT storytelling)
    //       const pointsData = getAllCoordinates();
    //       addRingsDataStatic(globeInstance, pointsData); 
    //     }
    //   }, []);

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
            <p>Here's where we'll visualize globe data.</p>

            <div className="globe-views-container"
                style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "stretch",
                    maxWidth: "95%",
                    height: "30rem",
                    gap: "1rem",
                }}
            >
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
                    <SharkSelector sharks={sharks} onReset={plotAllSharks} onSelect={plotSingleShark} />
                </div>

            </div>

        </div>
    );
}
  
export default GlobeViews;
  

