import { useState } from "react";
import { Camera, Crosshair, Scissors, Search, BarChart3, type LucideIcon } from "lucide-react";

type PipelineStep = {
    title: string;
    description: string;
    icon: LucideIcon;
};

const pipelineSteps: PipelineStep[] = [
    {
        title: "Image Acquisition",
        description:
            "Underwater cameras and drones capture high-resolution images and videos of whale sharks in their natural habitat.",
        icon: Camera,
    },
    {
        title: "Object Detection",
        description:
            "AI algorithms scan images to locate and identify whale sharks, drawing bounding boxes around detected individuals.",
        icon: Crosshair,
    },
    {
        title: "Segmentation",
        description:
            "Advanced models create precise pixel-level masks that outline the exact shape and boundaries of each whale shark.",
        icon: Scissors,
    },
    {
        title: "Pattern Recognition",
        description:
            "Computer vision analyzes the spot patterns and scars that are unique to each whale shark for individual identification.",
        icon: Search,
    },
    {
        title: "Data Analysis",
        description:
            "Extracted features are processed to re-identify known whale sharks by matching their embeddings in a database.",
        icon: BarChart3,
    },
];

const CVPipeline = () => {
    const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

    const toggleStep = (index: number) => {
        setExpandedSteps((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    return (
        <section className="cv-pipeline section-layout reverse">
            <div className="section-text">
                <h2>How Computer Vision Works</h2>
                <p>
                    This AI-powered pipeline for shark research involves several interconnected
                    steps that build upon each other to transform raw underwater imagery into
                    valuable scientific insights.
                </p>

                <div className="pipeline-steps">
                    {pipelineSteps.map((step: PipelineStep, i: number) => {
                        const Icon = step.icon;
                        return (
                            <div key={i} className="pipeline-step">
                                <div
                                    className="step-header clickable"
                                    onClick={() => toggleStep(i)}
                                >
                                    <span className="step-icon">
                                        <Icon className="step-svg-icon" />
                                    </span>
                                    <h3>
                                        {step.title}
                                        {i < pipelineSteps.length - 1}
                                    </h3>
                                    <span
                                        className={`expand-icon ${expandedSteps[i] ? "expanded" : ""}`}
                                    >
                                        ▼
                                    </span>
                                </div>

                                {expandedSteps[i] && (
                                    <div className="step-content">
                                        <p>{step.description}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="section-image">
                <div className="image-wrapper-large">
                    <img
                        src="./cv-pipeline-example.jpg"
                        alt="Example image in computer vision pipeline"
                    />

                    <p className="shark-image-meta">
                        <small>
                            <Camera className="credit-icon" /> Creator: richardtenbrinke | CC BY-NC [Attribution-NonCommercial]
                        </small>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default CVPipeline;
