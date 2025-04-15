import { Link } from "react-router-dom";
import { useRef } from "react";

import Globe from '../components/Globe.jsx';

function SharkTracker() {
    const globeRef = useRef();

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
        <p>Here's where we'll visualize whale shark data.</p>
        
        <button onClick={() => globeRef.current?.playStory()}>
          Play Story
        </button>

        <div className="globe-container">
            {/* Globe component */}
            <Globe ref={globeRef} />
        </div>
        
        <Link to="/home" style={{
            marginTop: "20px",
            fontSize: "18px",
            textDecoration: "underline",
            color: "blue"
        }}>
            Go back to Home Page
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
  

