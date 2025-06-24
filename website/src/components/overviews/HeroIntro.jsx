const HeroIntro = () => {
    return (
        <section className="hero-intro">
            <div className="hero">
                <div className="hero-content">
                    <h1>Meet the Whale Shark</h1>
                    <p>The ocean's largest fish — and one of its most peaceful.</p>
                </div>
            </div>

            <div className="intro">
                <div className="intro-text">
                    <h2>What is a Whale Shark?</h2>
                    <p>[Description paragraph here]</p>
                </div>
                <div className="intro-image">
                    <img src="/images/whale-shark-diagram.png" alt="Whale Shark Diagram" />
                </div>
            </div>
        </section>
    );
};

export default HeroIntro;

