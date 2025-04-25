import { Link } from "react-router-dom";

import SharkGenerator from "../components/SharkGenerator.jsx";

function BuildAShark() {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            overflowY: "auto", 
            textAlign: "center",
            padding: "20px",
        }}>
            <h1>BuildAShark Page</h1>
            <p>Here's where users can create their own cartoon shark image.</p>

            {/* Rendering SharkGenerator component */}
            <SharkGenerator />

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

            <Link to="/sharktracker" style={{
                marginTop: "20px",
                fontSize: "18px",
                textDecoration: "underline",
                color: "blue"
            }}>
                Go to SharkTracker Page
            </Link>

            <Link to="/datavisuals" style={{
                marginTop: "20px",
                fontSize: "18px",
                textDecoration: "underline",
                color: "blue"
            }}>
                Go to DataVisuals Page
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

export default BuildAShark;


