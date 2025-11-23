type Fact = {
    title: string; 
    detail: string; 
};


const facts: Fact[] = [
    { 
        title: "Largest Fish", 
        detail: "Can grow over 40 feet long!" 
    },
    { 
        title: "Filter Feeder", 
        detail: "Eats plankton, not people." 
    },
    { 
        title: "Unique Spots", 
        detail: "Patterns like a fingerprint." 
    },
];


const FunFacts = () => {
    return (
        <section className="fun-facts">
            <h2>Why They're Great</h2>

            <div className="facts-list">
                {facts.map((fact: Fact, i: number) => (
                    <div key={i} className="fact-card">
                        <h3>{fact.title}</h3>
                        <p>{fact.detail}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default FunFacts;

        