import ExtractPointsOnce from "../utils/ModelUtils.jsx";
import GalacticOcean from "../components/GalacticOcean.jsx";


function Home() {
    return (
        <div style={{ paddingTop: "40px" }}>

            <div 
                className="page-content" 
                style={{ 
                    color: "#b2ebf2", 
                    position: "relative", 
                    zIndex: 5 
                }}
            >
                <h1>Welcome to the Whale Shark Project</h1>
            </div>

            {/* <ExtractPointsOnce /> */}

            <GalacticOcean />

        </div>
    );
}

export default Home;


