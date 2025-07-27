import ExtractPointsOnce from "../utils/ModelUtils.jsx";
import GalacticOcean from "../components/GalacticOcean.jsx";


function Home() {
    return (
        <div style={{ paddingTop: "40px" }}>
            <>
                <style>
                    {`
                        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600&display=swap');
                    `}
                </style>

                <div 
                    className="page-content" 
                    style={{ 
                        color: "#b2ebf2", 
                        position: "relative", 
                        textAlign: "center",
                        fontSize: "0.8rem",
                        textShadow: "0 0 8px #81d4fa, 0 0 18px #4fc3f7, 0 0 30px #29b6f6",
                        zIndex: 5 
                    }}
                    >
                    <h1
                        style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 100,
                        letterSpacing: "0.6em",
                        margin: 0,
                        }}
                    >
                        discover the whale shark
                    </h1>
                </div>
            </>

            {/* <ExtractPointsOnce /> */}

            <GalacticOcean />

        </div>
    );
}

export default Home;


