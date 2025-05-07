import React from "react";
import { Link, useLocation } from "react-router-dom";

function Navbar() {
    // Get current route (page), so user knows where they are
    const location = useLocation(); 
    
    return (
        <nav style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#333",
            padding: "15px 15px",
            position: "fixed",
            top: 0,
            width: "100%",
            zIndex: 10
        }}>
            {/* Links */}
            <Link to="/home" style={getLinkStyle(location.pathname, "/home")}>Home</Link>
            <Link to="/globeviews" style={getLinkStyle(location.pathname, "/globeviews")}>Globe Views</Link>
            <Link to="/sharktracker" style={getLinkStyle(location.pathname, "/sharktracker")}>Shark Tracker</Link>
            <Link to="/datavisuals" style={getLinkStyle(location.pathname, "/datavisuals")}>Data Visuals</Link>
            <Link to="/buildashark" style={getLinkStyle(location.pathname, "/buildashark")}>Build-A-Shark</Link>
            <Link to="/animation" style={getLinkStyle(location.pathname, "/animation")}>Animation</Link>
        </nav>
    );
}
    
// Apply active styles based on current page location
const getLinkStyle = (currentPath, linkPath) => {
    return {
        margin: "0 25px",
        fontSize: "18px",
        textDecoration: "none",
        color: currentPath === linkPath ? "#fff41d" : "#fff",  // Active page gets yellow
        fontWeight: currentPath === linkPath ? "bold" : "normal", // Bold active link
        // transition: "color 0.1s ease",
    };
}

export default Navbar;

    