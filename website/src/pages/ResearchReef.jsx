import { Link } from "react-router-dom";

import SharkAnimation from "../components/SharkAnimation.jsx";


function ResearchReef() {
    const pages = [
        {
            path: "/globeviews",
            title: "Globe Views",
            description: "Explore global oceanographic patterns and satellite visualizations.",
            image: "/images/globeviews.jpg",
        },
        {
            path: "/sharktracker",
            title: "Shark Tracker",
            description: "Track real shark movement data in real time and historical views.",
            image: "/images/sharktracker.jpg",
        },
        {
            path: "/datavisuals",
            title: "Data Visuals",
            description: "Dive into interactive charts and datasets about marine life and climate.",
            image: "/images/datavisuals.jpg",
        },
        {
            path: "/environment",
            title: "Environment",
            description: "Learn about key environmental indicators affecting ocean health.",
            image: "/images/environment.jpg",
        },
    ];

    return (
        <div className="page-content research-reef-wrapper">
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
                className="reef-hero"
                style={{
                    backgroundImage: `url(/images/researchreef-hero.jpg)`,
                }}
            > */}
                <div className="reef-hero-content">
                    <h1>Welcome to the Research Reef</h1>
                    <p>
                        Dive into data. Track real-time movements. Visualize our oceans.
                    </p>
                </div>
            {/* </section> */}

            <div className="reef-intro">
                <p>
                    Research Reef is the science and data hub of our whale shark experience.
                    Here you'll find real-time tracking, global environmental insights, and
                    visualizations that help make sense of our oceans. Whether you’re a curious
                    explorer or a data lover, this section dives deep into the facts.
                </p>
            </div>

            <div className="reef-grid">
                {pages.map(({ path, title, description, image }) => (
                    <Link key={path} to={path} className="reef-card">
                        <img src={image} alt={title} className="reef-image" />
                        <div className="reef-card-content">
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
