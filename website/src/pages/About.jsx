import "../styles/about.css";

import HeroIntro from "../components/overviews/HeroIntro.jsx";
import HabitatMap from "../components/overviews/HabitatMap.jsx";
import FunFacts from "../components/overviews/FunFacts.jsx";
import ConservationStatus from "../components/overviews/ConservationStatus.jsx";
import FAQAccordion from "../components/overviews/FAQAccordion.jsx";


function About() {
    return (
        <div className="page-content about-page-wrapper">
            {/* <h1>About Page</h1> */}

            <HeroIntro />
            <HabitatMap />
            <FunFacts />
            <ConservationStatus />
            <FAQAccordion />
        
        </div>
    );
}

export default About;

