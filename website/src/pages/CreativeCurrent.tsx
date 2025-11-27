import { Link } from "react-router-dom";

import { PageMetadata } from "../types/pages"


function CreativeCurrent() {
    const pages: PageMetadata[] = [
        {
            path: "/creative/buildashark",
            title: "Build-A-Shark",
            description: "Create your own virtual whale shark based on selected features",
            image: "./build-a-shark.png",
        },
        {
            path: "/creative/animation",
            title: "Animation",
            description: "Customize your own 3D path and watch a shark swim along it",
            image: "./animation.png",
        },
    ];

    return (
        <div className="page-content research-creative-wrapper">
            
            <div className="research-creative-hero-content">
                <h1>Welcome to the Creative Current</h1>
                <p>Dive into imagination. Construct dynamic paths. Build whale sharks.</p>
            </div>

            <div className="research-creative-intro">
                <p className="tagline">
                    Creative Current is the playful and innovative sandbox of our whale shark experience. 
                </p>
                <p>    
                    Here you can invent your own shark, toy with the software behind 3D animations, 
                    and discover exciting ways to engage with the many wonders of our ocean. 

                    Whether you're an eager creator or simply an enthusiastic technologist, this
                    section will invite you to harness your experimental side and lean into the fun.
                </p>
            </div>

            <div className="research-creative-grid">
                {pages.map(({ path, title, description, image }: PageMetadata) => (
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

