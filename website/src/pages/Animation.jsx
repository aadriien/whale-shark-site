import SharkAnimation from "../components/SharkAnimation.jsx";

function Animation() {
    return (
        <div className="page-content">
            <h1>Animation Page</h1>

            <div style={{ width: "100vw", height: "70vh", background: "#1a1a1a" }} >
                {/* SharkAnimation component */}
                <SharkAnimation />
            </div>
        
        </div>
    );
}

export default Animation;


