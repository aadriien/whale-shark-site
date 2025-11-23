type Application = {
    title: string; 
    description: string; 
    impact: string; 
    icon: string; 
};


const applications: Application[] = [
    {
        title: "Individual Identification",
        description: "Each whale shark has a unique spot pattern. Computer vision can match and identify individuals from pictures.",
        impact: "Track migration patterns and population dynamics",
        icon: "🆔"
    },
    {
        title: "Population Monitoring", 
        description: "Automated tracking of whale sharks in large datasets helps scientists monitor population health and trends over time.",
        impact: "Assess conservation status and effectiveness",
        icon: "📈"
    },
    {
        title: "Behavior Analysis",
        description: "AI can detect and classify whale shark behaviors like feeding, mating, and social interactions from video footage.",
        impact: "Understand ecological roles and habitat needs",
        icon: "🎭"
    },
    {
        title: "Size Estimation",
        description: "Computer vision algorithms can measure whale shark length and estimate age, crucial for understanding growth rates.",
        impact: "Study life cycles and reproductive maturity",
        icon: "📏"
    },
    {
        title: "Habitat Mapping",
        description: "By analyzing where whale sharks are detected in images, researchers can map critical habitats and migration corridors.",
        impact: "Inform marine protected area planning",
        icon: "🗺️"
    },
    {
        title: "Health Assessment",
        description: "AI can detect injuries, scars, and parasites on whale sharks, helping monitor individual and population health.",
        impact: "Identify threats and conservation priorities",
        icon: "🏥"
    }
];


const CVApplications = () => {
    return (
        <section className="cv-applications">
            <h2>Research Applications</h2>
            <p>
                Computer vision technology is transforming whale shark research across multiple domains, 
                enabling new insights that were previously impossible or very time-consuming to obtain.
            </p>

            <div className="applications-grid">
                {applications.map((app: Application, i: number) => (
                    <div key={i} className="application-card">
                        <div className="app-header">
                            <span className="app-icon">{app.icon}</span>
                            <h3>{app.title}</h3>
                        </div>
                        <p className="app-description">{app.description}</p>
                        <div className="app-impact">
                            <strong>Impact:</strong> {app.impact}
                        </div>
                    </div>
                ))}
            </div>

            <div className="research-impact">
                <h3>Transforming Conservation</h3>
                <p>
                    These computer vision applications are revolutionizing how we study and protect whale sharks. 
                    By automating time-intensive analysis tasks, researchers can process vastly more data, 
                    leading to better understanding of whale shark ecology and more effective conservation strategies.
                </p>
                <p>
                    The technology also enables real-time monitoring and rapid response to threats, 
                    making whale shark conservation more proactive and data-driven than ever before.
                </p>
            </div>
        </section>
    );
};

export default CVApplications;

