import { Link, useLocation } from "react-router-dom";

import LightDarkToggle from "./controls/LightDarkMode.jsx";


function Navbar({ isLogbookOpen, setIsLogbookOpen, theme, setTheme }) {

    // Get current route (page), so user knows where they are
    const location = useLocation(); 

    const isResearchReef = location.pathname.startsWith("/research");
    const isCreativeCurrent = location.pathname.startsWith("/creative");

    const handleLogbookClick = () => {
        setIsLogbookOpen(prev => !prev);
    };

    return (
        <nav>
            <LightDarkToggle theme={theme} setTheme={setTheme} />

            <button
                onClick={handleLogbookClick}
                className={`logbook-button ${isLogbookOpen ? "active" : ""}`}
                title="Open Logbook"
                aria-label="Open Logbook" // for accessibility, e.g. screen readers
                type="button"
            >
                <img 
                    src="/whale-shark-icon.jpg" 
                    alt="Logbook icon" 
                />
            </button>

            <div className="version-toggle">
                <Link to="/research" className={isResearchReef ? "active-version reef" : "reef"}>
                    Research Reef
                </Link>
                <Link to="/creative" className={isCreativeCurrent ? "active-version current" : "current"}>
                    Creative Current
                </Link>
            </div>

            {/* Always visible */}
            <Link to="/home" className={location.pathname === "/home" ? "active" : ""}>Home</Link>
            <Link to="/about" className={location.pathname === "/about" ? "active" : ""}>About</Link>

            {/* Research Reef only */}
            {isResearchReef && (
                <>
                    <Link to="/research/globeviews" className={location.pathname === "/research/globeviews" ? "active" : ""}>Globe Views</Link>
                    <Link to="/research/sharktracker" className={location.pathname === "/research/sharktracker" ? "active" : ""}>Shark Tracker</Link>
                    <Link to="/research/geolabs" className={location.pathname === "/research/geolabs" ? "active" : ""}>Geo Labs</Link>
                    <Link to="/research/datavisuals" className={location.pathname === "/research/datavisuals" ? "active" : ""}>Data Visuals</Link>
                    <Link to="/research/environment" className={location.pathname === "/research/environment" ? "active" : ""}>Environment</Link>
                </>
            )}

            {/* Creative Current only */}
            {isCreativeCurrent && (
                <>
                    <Link to="/creative/buildashark" className={location.pathname === "/creative/buildashark" ? "active" : ""}>Build-A-Shark</Link>
                    <Link to="/creative/animation" className={location.pathname === "/creative/animation" ? "active" : ""}>Animation</Link>
                </>
            )}
        </nav>
    );
}
    
export default Navbar;

    