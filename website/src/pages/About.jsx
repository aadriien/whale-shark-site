import "../styles/about.css";

import HeroIntro from "../components/overviews/HeroIntro.jsx";
import HabitatMap from "../components/overviews/HabitatMap.jsx";
import FunFacts from "../components/overviews/FunFacts.jsx";
import ConservationStatus from "../components/overviews/ConservationStatus.jsx";
import FAQAccordion from "../components/overviews/FAQAccordion.jsx";


function About() {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            overflowY: "auto",
            textAlign: "center",
            paddingTop: "0px"
        }}>
            <h1>About Page</h1>

            <HeroIntro />
            <HabitatMap />
            <FunFacts />
            <ConservationStatus />
            <FAQAccordion />
        
        </div>
    );
}

export default About;

