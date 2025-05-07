import ContinentData from "../components/ContinentData.jsx";

function DataVisuals() {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            overflowY: "auto", 
            textAlign: "center",
            paddingTop: "60px"
        }}>
            <h1>DataVisuals Page</h1>
            <p>Here's where we'll incorporate d3.js visualizations.</p>

            {/* Rendering GBIFContinentOccurrences component */}
            <ContinentData />
            
        </div>
    );
}

export default DataVisuals;


