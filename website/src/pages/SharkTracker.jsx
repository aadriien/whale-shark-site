import { Link } from "react-router-dom";
import { useRef } from "react";

import Globe from "../components/Globe.jsx";
import SharkGrid from "../components/SharkGrid.jsx";

function SharkTracker() {
  const globeRef = useRef();

  const sharks = [
    { id: 1, name: "Shark 1" },
    { id: 2, name: "Shark 2" },
    { id: 3, name: "Shark 3" },
    { id: 4, name: "Shark 4" },
    // Add more sharks as needed (TEST)
  ];

  const mid = Math.ceil(sharks.length / 2);
  const leftSharks = sharks.slice(0, mid);
  const rightSharks = sharks.slice(mid);

  return (
    <div style={{ minHeight: "100vh", padding: "2rem", textAlign: "center" }}>
      <h1>SharkTracker Page</h1>
      <p>Here's where we'll do whale shark storytelling.</p>

      <button onClick={() => globeRef.current?.playStory()} style={{ margin: "1rem 0" }}>
        Play Story
      </button>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: "1rem",
          marginTop: "2rem",
        }}
      >
        {/* Left Shark Cards */}
        <div style={{ flex: "0.15", height: "35rem" }}>
          <SharkGrid sharks={leftSharks} />
        </div>

        {/* Globe */}
        <div className="globe-container" style={{ flex: "0.7", height: "35rem" }}>
          <Globe ref={globeRef} />
        </div>

        {/* Right Shark Cards */}
        <div style={{ flex: "0.15", height: "35rem" }}>
          <SharkGrid sharks={rightSharks} />
        </div>
      </div>

      {/* Links */}
      <div style={{ marginTop: "2rem" }}>
        <Link to="/home" style={linkStyle}>Go back to Home Page</Link>
        <Link to="/globeviews" style={linkStyle}>Go to GlobeViews Page</Link>
        <Link to="/animation" style={linkStyle}>Go to Animation Page</Link>
      </div>
    </div>
  );
}

const linkStyle = {
  fontSize: "18px",
  textDecoration: "underline",
  color: "blue",
  display: "block",
  margin: "0.5rem 0"
};

export default SharkTracker;

  

