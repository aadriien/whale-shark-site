import HeroIntro from "../components/overviews/HeroIntro.tsx";
import HabitatMap from "../components/overviews/HabitatMap.tsx";
import FunFacts from "../components/overviews/FunFacts.tsx";
import ConservationStatus from "../components/overviews/ConservationStatus.jsx";
import FAQAccordion from "../components/overviews/FAQAccordion.tsx";


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

