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
            paddingTop: "60px"
        }}>
            <h1>BuildAShark Page</h1>

            {/* Rendering SharkGenerator component */}
            <SharkGenerator />
        
        </div>
    );
}

export default BuildAShark;


