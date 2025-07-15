import { Link, useLocation } from "react-router-dom";

function Navbar() {
    // Get current route (page), so user knows where they are
    const location = useLocation(); 
    
    return (
        <nav>
            <Link to="/home" className={location.pathname === "/home" ? "active" : ""}>Home</Link>
            <Link to="/about" className={location.pathname === "/about" ? "active" : ""}>About</Link>

            <Link to="/globeviews" className={location.pathname === "/globeviews" ? "active" : ""}>Globe Views</Link>
            <Link to="/sharktracker" className={location.pathname === "/sharktracker" ? "active" : ""}>Shark Tracker</Link>
            <Link to="/datavisuals" className={location.pathname === "/datavisuals" ? "active" : ""}>Data Visuals</Link>
            <Link to="/environment" className={location.pathname === "/environment" ? "active" : ""}>Environment</Link>
            <Link to="/buildashark" className={location.pathname === "/buildashark" ? "active" : ""}>Build-A-Shark</Link>
            <Link to="/animation" className={location.pathname === "/animation" ? "active" : ""}>Animation</Link>
        </nav>
    );
}
    
export default Navbar;

    