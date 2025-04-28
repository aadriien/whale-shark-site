import { Link } from "react-router-dom";

import SharkAnimation from "../components/SharkAnimation.jsx";

function Home() {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            textAlign: "center"
        }}>
            <h1>Welcome to the Whale Shark Project</h1>

            <div 
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '20vh',
                    width: '100%',
                    overflow: 'hidden',
                    background: "#1a1a1a",
                }}
            >
                {/* SharkAnimation component */}
                <SharkAnimation />
            </div>

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

            <Link to="/buildashark" style={{
                marginTop: "20px",
                fontSize: "18px",
                textDecoration: "underline",
                color: "blue"
            }}>
                Go to BuildAShark Page
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

export default Home;


