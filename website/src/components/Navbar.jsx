import { Link, useLocation } from "react-router-dom";

function Navbar() {
    // Get current route (page), so user knows where they are
    const location = useLocation(); 

    const isResearchReef = location.pathname.startsWith("/research");
    const isCreativeCurrent = location.pathname.startsWith("/creative");
    
    return (
        <nav>
            <div className="version-toggle">
                <Link to="/research" className={isResearchReef ? "active-version" : ""}>
                    Research Reef
                </Link>
                <Link to="/creative" className={isCreativeCurrent ? "active-version" : ""}>
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

    