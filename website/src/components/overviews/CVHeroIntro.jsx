const CVHeroIntro = () => {
    return (
        <div className="cv-hero-intro">

            <section
                className="hero"
                style={{
                    background: `url(./cv-whale-shark-hero.png) center/cover no-repeat`
                }}
            >
                <div className="hero-content">
                    <h1>AI for Whale Sharks</h1>
                    <p>Using computer vision to protect the ocean's gentle giants.</p>
                </div>
            </section>

            <section className="intro section-layout">
                <div className="section-text">
                    <h2>What is Computer Vision?</h2>
                    <p>
                        Computer vision is the field of artificial intelligence that 
                        teaches computers to "see" and understand images and videos, 
                        much like how humans process visual information.
                    </p>
                    <p>
                        For whale shark research, computer vision revolutionizes how we 
                        study these magnificent creatures. Instead of relying solely on 
                        manual observation and identification, we can now automatically 
                        detect, track, and analyze whale sharks from underwater footage 
                        and photographs.
                    </p>
                    <p>
                        This technology enables researchers to process thousands of images 
                        quickly, identify individual sharks by their unique spot patterns, 
                        measure their size and behavior, and monitor populations across 
                        vast ocean territories — all while minimizing human disturbance 
                        to these gentle giants.
                    </p>
                </div>

                <div className="section-image">
                    <img src="./cv-intro-example.jpg" alt="Bounding box for whale shark with computer vision" />
                </div>
            </section>

        </div>
    );
};

export default CVHeroIntro;

