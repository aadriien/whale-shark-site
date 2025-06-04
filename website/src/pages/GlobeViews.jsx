import { useEffect, useRef } from "react";

import Globe from "../components/Globe.jsx";
import SharkInfoPanel from "../components/SharkInfoPanel.jsx";

import { getAllCoordinates } from "../utils/CoordinateUtils.js";
import { addRingsData, addRingsDataStatic } from "../utils/GlobeUtils.js";


function GlobeViews() {
    const globeRef = useRef();

    useEffect(() => {
        if (globeRef.current) {
          const globeInstance = globeRef.current.getGlobe();

          // Populate all data on whole globe (NOT storytelling)
          const pointsData = getAllCoordinates();
          addRingsDataStatic(globeInstance, pointsData); 
        }
      }, []);

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

            </div>

        </div>
    );
}
  
export default GlobeViews;
  

