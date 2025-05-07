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
            textAlign: "center",
            paddingTop: "60px"
        }}>
            <h1>Animation Page</h1>

            <div style={{ width: "100vw", height: "70vh", background: "#1a1a1a" }} >
                {/* SharkAnimation component */}
                <SharkAnimation />
            </div>
        
        </div>
    );
}

export default Animation;


