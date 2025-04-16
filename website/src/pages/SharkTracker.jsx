import { Link } from "react-router-dom";
import { useRef } from "react";

import Globe from '../components/Globe.jsx';
import SharkGrid from "../components/SharkGrid.jsx";

function SharkTracker() {
    const globeRef = useRef();

    const sharks = [
        { id: 1, name: "Shark 1" },
        { id: 2, name: "Shark 2" },
        { id: 3, name: "Shark 3" },
        { id: 4, name: "Shark 4" },
        // Add more sharks as needed
      ];

    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        textAlign: "center"
      }}>
        <h1>SharkTracker Page</h1>
        <p>Here's where we'll do whale shark storytelling.</p>
        
        <button onClick={() => globeRef.current?.playStory()}>
          Play Story
        </button>

        <div className="globe-container">
            {/* Globe component */}
            <Globe ref={globeRef} />
        </div>

        <div>
            {/* Pass sharks data to SharkGrid */}
            <SharkGrid sharks={sharks} />
        </div>
        
        <Link to="/home" style={{
            marginTop: "20px",
            fontSize: "18px",
            textDecoration: "underline",
            color: "blue"
        }}>
            Go back to Home Page
        </Link>

        <Link to="/globeviews" style={{
            marginTop: "20px",
            fontSize: "18px",
            textDecoration: "underline",
            color: "blue"
        }}>
            Go to GlobeViews Page
        </Link>

        <Link to="/animation" style={{
            marginTop: "20px",
            fontSize: "18px",
            textDecoration: "underline",
            color: "blue"
        }}>
            Go to Animation Page
        </Link>
        
      </div>
    );
  }
  
  export default SharkTracker;
  

