import HeroIntro from "../components/overviews/HeroIntro";
import HabitatMap from "../components/overviews/HabitatMap";
import FunFacts from "../components/overviews/FunFacts";
import ConservationStatus from "../components/overviews/ConservationStatus";
import FAQAccordion from "../components/overviews/FAQAccordion";


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

