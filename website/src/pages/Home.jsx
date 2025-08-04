import React, { useEffect, useState } from "react";

import ExtractPointsOnce from "../utils/ModelUtils.jsx";
import GalacticOcean from "../components/GalacticOcean.jsx";


function Home() {
    // Be mindful of home screen display on mobile (adjust slightly)
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    return (
        <div style={{ paddingTop: "40px" }}>
            <>
                <style>
                    {`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600&display=swap');`}
                </style>

                <div 
                    className="page-content" 
                    style={{ 
                        position: "relative", 
                        textAlign: "center",
                        zIndex: 5 
                    }}
                    >
                    <h1
                        style={{
                            color: "#b2ebf2", 
                            textShadow: "0 0 8px #81d4fa, 0 0 18px #4fc3f7, 0 0 30px #29b6f6",
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 100,
                            fontSize: isMobile ? "2.3rem" : "2.6rem",
                            letterSpacing: isMobile ? "0.4em" : "0.6em",
                            lineHeight: "2.5rem",
                            margin: 0,
                        }}
                    >
                        discover the whale shark
                    </h1>
                </div>
            </>

            {/* <ExtractPointsOnce /> */}

            <GalacticOcean isMobile={isMobile} />

        </div>
    );
}

export default Home;


