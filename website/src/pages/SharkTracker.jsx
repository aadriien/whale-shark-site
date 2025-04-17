import { Link } from "react-router-dom";
import { useRef } from "react";

import Globe from "../components/Globe.jsx";
import SharkGrid from "../components/SharkGrid.jsx";

import { storySharks } from "../utils/DataUtils.js";

function SharkTracker() {
  const globeRef = useRef();

  const sharks = storySharks;

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
        <div style={{ flex: "0.1", height: "35rem" }}>
          <SharkGrid sharks={leftSharks} />
        </div>

        {/* Globe */}
        <div className="globe-container" style={{ flex: "0.8", height: "37rem" }}>
          <Globe ref={globeRef} />
        </div>

        {/* Right Shark Cards */}
        <div style={{ flex: "0.1", height: "35rem" }}>
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

  

