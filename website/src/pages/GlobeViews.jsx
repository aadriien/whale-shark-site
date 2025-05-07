import { useEffect, useRef } from "react";

import Globe from "../components/Globe.jsx";

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

            <div className="globe-container" style={{ maxWidth: "80%", maxHeight: "80%" }}>
                {/* Globe component */}
                <Globe ref={globeRef} />
            </div>

        </div>
    );
}
  
export default GlobeViews;
  

