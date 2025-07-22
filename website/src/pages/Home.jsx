import { Suspense, lazy } from "react";

import SharkAnimation from "../components/SharkAnimation.jsx";
import GlowingShark from "../components/GlowingShark.jsx";
import GlowSharkAnimated from "../components/GlowSharkAnimated.jsx";

import GalacticOcean from "../components/GalacticOcean.jsx";

import ExtractPointsOnce from "../utils/ModelUtils.jsx";

const BackgroundVideo = lazy(() => import("../components/BackgroundVideo.jsx"));

function Home() {
    return (
        <div style={{ position: "relative", height: "100vh", overflow: "hidden", paddingTop: "40px" }}>
            {/* BackgroundVideo component of whale shark swimming */}
            {/* <BackgroundVideo /> */}

            <div className="page-content" style={{ color: "#b2ebf2" }}>
                <h1>Welcome to the Whale Shark Project</h1>
            </div>

            {/* <ExtractPointsOnce /> */}

            <GalacticOcean />

            {/* <GlowingShark /> */}
            <GlowSharkAnimated />

            <div className="page-content">
                <h1>Welcome to the Whale Shark Project</h1>

                {/* <div 
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '20vh',
                        width: '100%',
                        overflow: 'hidden',
                        background: "#1a1a1a",
                    }}
                > */}
                    {/* SharkAnimation component */}
                    {/* <SharkAnimation />
                </div> */}
            
            </div>
        </div>
    );
}

export default Home;


