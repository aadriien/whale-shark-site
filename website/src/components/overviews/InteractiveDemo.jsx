import { useState } from 'react';


// Sample data for demo images
function createWhaleSharkImage(id, name, description, creator, license) {
    return {
        id,
        name,
        original: `./cv-demos/shark_${id}_original.jpg`,
        bbox: `./cv-demos/shark_${id}_bbox.jpg`,
        segmentation: `./cv-demos/shark_${id}_segmentation.jpg`,
        description,
        creator,
        license
    };
}

const demoImages = [
    createWhaleSharkImage(
        3070393848, 
        "Whale Shark #1", 
        "TBD.. description currently a WIP",
        "stefzanirato",
        "CC BY-NC [Attribution-NonCommercial]"
    ),
    createWhaleSharkImage(
        3338151009, 
        "Whale Shark #2", 
        "TBD.. description currently a WIP",
        "Carlos Gajón Bermúdez",
        "CC BY-NC [Attribution-NonCommercial]"
    ),
    createWhaleSharkImage(
        4177294484, 
        "Whale Shark #3", 
        "TBD.. description currently a WIP",
        "Nathan Cook",
        "CC BY-NC [Attribution-NonCommercial]"
    ),
    createWhaleSharkImage(
        4900906641, 
        "Whale Shark #4", 
        "TBD.. description currently a WIP",
        "Slunky",
        "CC BY [Attribution]"
    ),
];


const InteractiveDemo = () => {
    const [selectedImage, setSelectedImage] = useState(demoImages[0]);
    const [activeView, setActiveView] = useState('Original');

    const getCurrentImageSrc = () => {
        switch (activeView) {
            case 'BBOX':
                return selectedImage.bbox;
            case 'Segmentation':
                return selectedImage.segmentation;
            default:
                return selectedImage.original;
        }
    };

    const getViewDescription = () => {
        switch (activeView) {
            case 'BBOX':
                return "Bounding box detection highlights where the AI has identified whale sharks in the image, along with its confidence.";
            case 'Segmentation':
                return "Segmentation masks show the precise pixel-level outline of each detected whale shark.";
            default:
                return "Original underwater photograph captured by researchers or underwater cameras.";
        }
    };

    return (
        <section className="interactive-demo">
            <h2>Try It Yourself</h2>
            <p>
                Select a real-world whale shark below and explore how computer vision 
                processes the same image through various AI-powered analytical stages.
            </p>

            {/* Image Selection */}
            <div className="image-selector">
                <h3>Choose an Image:</h3>

                <div className="image-thumbnails">
                    {demoImages.map((image) => (
                        <div 
                            key={image.id}
                            className={`thumbnail ${selectedImage.id === image.id ? 'active' : ''}`}
                            onClick={() => setSelectedImage(image)}
                        >
                            <div className="image-wrapper">
                                <img src={image.original} alt={image.name} />

                                <p className="shark-image-meta">
                                    <small>📸 Creator: {image.creator} | {image.license}</small>
                                </p>
                            </div>

                            <div className="thumbnail-info">
                                <h4>{image.name}</h4>
                                <p>{image.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

            </div>

            {/* Analysis View Controls */}
            <div className="view-controls">
                <h3>Analysis View:</h3>
                
                <div className="control-buttons">
                    <button 
                        className={activeView === 'Original' ? 'active' : ''}
                        onClick={() => setActiveView('Original')}
                    >
                        Original Image
                    </button>
                    <button 
                        className={activeView === 'BBOX' ? 'active' : ''}
                        onClick={() => setActiveView('BBOX')}
                    >
                        Bounding Box
                    </button>
                    <button 
                        className={activeView === 'Segmentation' ? 'active' : ''}
                        onClick={() => setActiveView('Segmentation')}
                    >
                        Segmentation
                    </button>
                </div>
            </div>

            {/* Main Display */}
            <div className="demo-display">
                <div className="image-container">
                    <img 
                        src={getCurrentImageSrc()} 
                        alt={`${selectedImage.name} - ${activeView}`}
                        className="demo-image"
                    />
                </div>
                
                <div className="analysis-info">
                    <h3>{selectedImage.name} - {activeView}</h3>

                    <p className="view-description">
                        {getViewDescription()}
                    </p>

                    <div className="image-details">
                        <p><strong>Description:</strong> {selectedImage.description}</p>
                        <p><strong>Current View:</strong> {activeView} Analysis</p>
                    </div>
                </div>
            </div>

        </section>
    );
};

export default InteractiveDemo;

