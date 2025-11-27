import SharkAnimation from "../components/animations/SharkAnimation";


function Animation() {
    return (
        <div className="animation-wrapper">
            <div style={{ width: "100vw", height: "100vh", background: "#1a1a1a" }} >
                {/* SharkAnimation component */}
                <SharkAnimation />
            </div>
        
        </div>
    );
}

export default Animation;


