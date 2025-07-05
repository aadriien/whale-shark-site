const HeroIntro = () => {
    return (
        <div className="hero-intro">

            <section
                className="hero"
                style={{
                    background: `url(./whale-shark-hero.jpg) center/cover no-repeat`
                }}
            >
                <div className="hero-content">
                    <h1>Meet the Whale Shark</h1>
                    <p>The ocean's largest fish — and one of its most peaceful.</p>
                </div>
            </section>

            <section className="intro section-layout">
                <div className="section-text">
                    <h2>What is a Whale Shark?</h2>
                    <p>
                        Whale sharks (<em>Rhincodon typus</em>) 
                        are the gentle giants of the ocean. 
                        They are the world's largest living fish, 
                        growing up to 12 meters (40 feet) long — 
                        roughly the size of a school bus!  
                    </p>
                    <p>
                        Despite its enormous size, the whale shark is a peaceful filter feeder, 
                        gliding slowly through warm oceans while scooping up 
                        tiny plankton, fish eggs, and small fish. 
                    </p>
                    <p>
                        With its spotted skin and wide, flattened head, 
                        the whale shark is easy to recognize and beloved by divers worldwide. 
                    </p>
                    <p>
                        These beautiful and awe-inspiring giants play an important role 
                        in keeping ocean ecosystems balanced.
                    </p>
                </div>

                <div className="section-image">
                    <img src="./whale-shark-intro.jpg" alt="Whale Shark" />
                </div>
            </section>

        </div>
    );
};

export default HeroIntro;

