import { Link } from "react-router-dom";

function CreativeCurrent() {
    const pages = [
        {
            path: "/creative/buildashark",
            title: "Build-A-Shark",
            description: "Create your own virtual shark with custom features and colors.",
            image: "/images/buildashark.jpg",
        },
        {
            path: "/creative/animation",
            title: "Animation",
            description: "Watch beautiful ocean animations and learn how they're made.",
            image: "/images/animation.jpg",
        },
    ];

    return (
        <div className="page-content research-creative-wrapper">
            {/* <section className="research-creative-hero"> */}
                <div className="research-creative-hero-content">
                    <h1>Welcome to the Creative Current!</h1>
                    <p>Build sharks, watch animations, and dive into creativity.</p>
                </div>
            {/* </section> */}

            <div className="research-creative-intro">
                <p>
                    Creative Current is your hub for interactive ocean creativity. Customize your own shark, 
                    explore stunning animations inspired by marine life, and discover playful ways to engage 
                    with the sea's wonders. Whether you're a creator or just curious, this section invites you 
                    to dive in and have fun.
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

export default CreativeCurrent;
