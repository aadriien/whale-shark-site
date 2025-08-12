import { Link } from "react-router-dom";

import SharkAnimation from "../components/SharkAnimation.jsx";


function ResearchReef() {
    const pages = [
        {
            path: "/research/globeviews",
            title: "Globe Views",
            description: "Explore global oceanographic patterns and satellite visualizations.",
            image: "./globe-views.png",
        },
        {
            path: "/research/sharktracker",
            title: "Shark Tracker",
            description: "Track real shark movement data in real time and historical views.",
            image: "./shark-tracker.png",
        },
        {
            path: "/research/geolabs",
            title: "Geo Labs",
            description: "Experiment with favorited sharks and map their connections.",
            image: "./globe-views.png",
        },
        {
            path: "/research/datavisuals",
            title: "Data Visuals",
            description: "Dive into interactive charts and datasets about marine life and climate.",
            image: "./data-visuals.png",
        },
        {
            path: "/research/environment",
            title: "Environment",
            description: "Learn about key environmental indicators affecting ocean health.",
            image: "./environment.png",
        },
    ];

    return (
        <div className="page-content research-creative-wrapper">
            {/* <div style={{ overflow: 'hidden', width: '100%' }}>
                <div 
                    style={{
                        position: 'relative',
                        margin: '0 auto',
                        height: '15vh',
                        width: '100%',  // wider than visible area
                        overflow: 'visible',
                        background: '#1a1a1a',
                    }}
                >
                    <div style={{ position: 'relative', top: '15px' }}>
                        <SharkAnimation />
                    </div>
                </div>
            </div> */}

            {/* <section
                className="research-creative-hero"
                style={{
                    backgroundImage: `url(/images/research-reef-hero.png)`,
                }}
            > */}
                <div className="research-creative-hero-content">
                    <h1>Welcome to the Research Reef</h1>
                    <p>
                        Dive into data. Track real-time movements. Visualize our oceans.
                    </p>
                </div>
            {/* </section> */}

            <div className="research-creative-intro">
                <p>
                    Research Reef is the science and data hub of our whale shark experience.
                    Here you'll find real-time tracking, global environmental insights, and
                    visualizations that help make sense of our oceans. Whether you’re a curious
                    explorer or a data lover, this section dives deep into the facts.
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
