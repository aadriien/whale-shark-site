const pipelineSteps = [
    {
        title: "Image Acquisition",
        description: "Underwater cameras and drones capture high-resolution images and videos of whale sharks in their natural habitat.",
        icon: "📷"
    },
    {
        title: "Object Detection",
        description: "AI algorithms scan images to locate and identify whale sharks, drawing bounding boxes around detected individuals.",
        icon: "🎯"
    },
    {
        title: "Segmentation",
        description: "Advanced models create precise pixel-level masks that outline the exact shape and boundaries of each whale shark.",
        icon: "✂️"
    },
    {
        title: "Pattern Recognition",
        description: "Computer vision analyzes the unique spot patterns on each whale shark for individual identification and tracking.",
        icon: "🔍"
    },
    {
        title: "Data Analysis",
        description: "Extracted features are processed to measure size, behavior, population dynamics, and migration patterns.",
        icon: "📊"
    }
];

const CVPipeline = () => {
    return (
        <section className="cv-pipeline section-layout reverse">
            <div className="section-text">
                <h2>How Computer Vision Works</h2>
                <p>
                    The computer vision pipeline for whale shark research involves several 
                    interconnected steps that transform raw underwater imagery into valuable 
                    scientific insights.
                </p>
                <p>
                    Each stage builds upon the previous one, creating a comprehensive system 
                    that can automatically process vast amounts of visual data with unprecedented 
                    speed and accuracy.
                </p>
                
                <div className="pipeline-steps">
                    {pipelineSteps.map((step, i) => (
                        <div key={i} className="pipeline-step">
                            <div className="step-header">
                                <span className="step-icon">{step.icon}</span>
                                <h3>{step.title}</h3>
                            </div>
                            <p>{step.description}</p>
                            {i < pipelineSteps.length - 1 && <div className="step-arrow">↓</div>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="section-image">
                <img src="./cv-pipeline-diagram.jpg" alt="Computer Vision Pipeline Diagram" />
            </div>
        </section>
    );
};

export default CVPipeline;

