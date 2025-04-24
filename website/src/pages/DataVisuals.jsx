import { Link } from "react-router-dom";

function DataVisuals() {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            textAlign: "center"
        }}>
            <h1>DataVisuals Page</h1>
            <p>Here's where we'll incorporate d3.js visualizations.</p>

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

            <Link to="/sharkgenerator" style={{
                marginTop: "20px",
                fontSize: "18px",
                textDecoration: "underline",
                color: "blue"
            }}>
                Go to SharkGenerator Page
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

export default DataVisuals;


