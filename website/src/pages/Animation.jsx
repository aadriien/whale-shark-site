import { Link } from "react-router-dom";

import SharkAnimation from "../components/SharkAnimation.jsx";

function Animation() {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            overflowY: "auto",
            textAlign: "center"
        }}>
            <h1>Animation Page</h1>

            <div>
                {/* SharkAnimation component */}
                <SharkAnimation />
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

            <Link to="/sharkgenerator" style={{
                marginTop: "20px",
                fontSize: "18px",
                textDecoration: "underline",
                color: "blue"
            }}>
                Go to SharkGenerator Page
            </Link>
        
        </div>
    );
}

export default Animation;


