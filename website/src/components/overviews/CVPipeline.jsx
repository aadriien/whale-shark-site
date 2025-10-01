import { useState } from 'react'; 


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
        description: "Computer vision analyzes the spot patterns and scars that are unique to each whale shark for individual identification.",
        icon: "🔍"
    },
    {
        title: "Data Analysis",
        description: "Extracted features are processed to re-identify known whale sharks by matching their embeddings in a database.",
        icon: "📊"
    }
];


const CVPipeline = () => {
    const [expandedSteps, setExpandedSteps] = useState({});

    const toggleStep = (index) => {
        setExpandedSteps(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    return (
        <section className="cv-pipeline section-layout reverse">
            <div className="section-text">
                <h2>How Computer Vision Works</h2>
                <p>
                    This AI-powered pipeline for shark research involves several 
                    interconnected steps that build upon each other to transform raw  
                    underwater imagery into valuable scientific insights.
                </p>
                
                <div className="pipeline-steps">
                    {pipelineSteps.map((step, i) => (
                        <div key={i} className="pipeline-step">

                            <div 
                                className="step-header clickable" 
                                onClick={() => toggleStep(i)}
                            >
                                <span className="step-icon">{step.icon}</span>
                                <h3>
                                    {step.title}
                                    {i < pipelineSteps.length - 1}
                                </h3>
                                <span className={`expand-icon ${expandedSteps[i] ? 'expanded' : ''}`}>▼</span>
                            </div>
                            
                            {expandedSteps[i] && (
                                <div className="step-content">
                                    <p>{step.description}</p>
                                </div>
                            )}

                        </div>
                    ))}
                </div>
            </div>

            <div className="section-image">
                <div className="image-wrapper-large">
                    <img src="./cv-pipeline-example.jpg" alt="Example image in computer vision pipeline" />

                    <p className="shark-image-meta">
                        <small>📸 Creator: richardtenbrinke | CC BY-NC [Attribution-NonCommercial]</small>
                    </p>
                </div>
            </div>

        </section>
    );
};

export default CVPipeline;

