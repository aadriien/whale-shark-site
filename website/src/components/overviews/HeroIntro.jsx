const HeroIntro = () => {
    return (
        <div className="hero-intro">
            <section className="hero">
                <div className="hero-content">
                    <h1>Meet the Whale Shark</h1>
                    <p>The ocean's largest fish — and one of its most peaceful.</p>
                </div>
            </section>

            <section className="intro section-layout">

                <div className="section-text">
                    <h2>What is a Whale Shark?</h2>
                    <p>[Description paragraph here]</p>
                </div>

                <div className="section-image">
                    <img src="./whale-shark-intro.jpg" alt="Whale Shark" />
                </div>
                
            </section>
        </div>
    );
};

export default HeroIntro;

