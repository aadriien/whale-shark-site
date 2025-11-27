import { Link } from "react-router-dom";


function ResearchReef() {
    const pages = [
        {
            path: "/research/globeviews",
            title: "Globe Views",
            description: "Explore real data from thousands of whale sharks around the world",
            image: "./globe-views.png",
        },
        {
            path: "/research/sharktracker",
            title: "Shark Tracker",
            description: "Trace the stories of actual whale sharks with satellite technology",
            image: "./shark-tracker.png",
        },
        {
            path: "/research/geolabs",
            title: "Geo Labs",
            description: "Experiment with your favorite sharks and map their connections",
            image: "./geo-labs.png",
        },
        {
            path: "/research/datavisuals",
            title: "Data Visuals",
            description: "Dive into interactive charts and uncover meaningful insights",
            image: "./data-visuals.png",
        },
        {
            path: "/research/environment",
            title: "Environment",
            description: "Discover key marine conditions that can affect whale sharks",
            image: "./environment.png",
        },
        {
            path: "/research/sharkvision",
            title: "Shark Vision",
            description: "Learn about computer vision and its impact on scientific research",
            image: "./shark-vision.png",
        },
    ];

    return (
        <div className="page-content research-creative-wrapper">

            <div className="research-creative-hero-content">
                <h1>Welcome to the Research Reef</h1>
                <p>Dive into data. Track real movements. Explore our oceans.</p>
            </div>

            <div className="research-creative-intro">
                <p className="tagline">
                    Research Reef is the authentic science and data hub of our whale shark experience.
                </p>
                <p>
                    Here you'll find real-world shark media, detailed satellite tracking, 
                    global ecological insights, interactive Earth visualizations, 
                    thoughtful data analyses, and customizable geomapping. 

                    Whether you're a curious explorer or simply a lover of the natural world, 
                    this section will lead you deep into the facts and the wonderment.
                </p>
            </div>

            <div className="research-creative-grid">
                {pages.map(({ path, title, description, image }) => (
                    <Link key={path} to={path} className="research-creative-card">
                        <img src={image} alt={title} className="research-creative-image" />
                        <div className="research-creative-card-content">
                            <h3>{title}</h3>
                            <p>{description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default ResearchReef;
