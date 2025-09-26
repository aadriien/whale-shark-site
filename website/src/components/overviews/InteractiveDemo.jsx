import { useState } from 'react';


// Sample data for demo images
const demoImages = [
    {
        id: 1,
        name: "Whale Shark #1",
        original: "./demo/whale-shark-1-original.jpg",
        bbox: "./demo/whale-shark-1-bbox.jpg",
        segmentation: "./demo/whale-shark-1-segmentation.jpg",
        description: "Adult whale shark feeding near the surface"
    },
    {
        id: 2,
        name: "Whale Shark #2", 
        original: "./demo/whale-shark-2-original.jpg",
        bbox: "./demo/whale-shark-2-bbox.jpg",
        segmentation: "./demo/whale-shark-2-segmentation.jpg",
        description: "Juvenile whale shark with distinctive spot pattern"
    },
    {
        id: 3,
        name: "Whale Shark #3",
        original: "./demo/whale-shark-3-original.jpg",
        bbox: "./demo/whale-shark-3-bbox.jpg", 
        segmentation: "./demo/whale-shark-3-segmentation.jpg",
        description: "Multiple whale sharks in schooling formation"
    }
];


const InteractiveDemo = () => {
    const [selectedImage, setSelectedImage] = useState(demoImages[0]);
    const [activeView, setActiveView] = useState('original');

    const getCurrentImageSrc = () => {
        switch (activeView) {
            case 'bbox':
                return selectedImage.bbox;
            case 'segmentation':
                return selectedImage.segmentation;
            default:
                return selectedImage.original;
        }
    };

    const getViewDescription = () => {
        switch (activeView) {
            case 'bbox':
                return "Bounding box detection highlights where the AI has identified whale sharks in the image.";
            case 'segmentation':
                return "Segmentation masks show the precise pixel-level outline of each detected whale shark.";
            default:
                return "Original underwater photograph captured by researchers or underwater cameras.";
        }
    };

    return (
        <section className="interactive-demo">
            <h2>Try It Yourself</h2>
            <p>
                Select a whale shark image below and explore how computer vision 
                processes the same image through different analysis stages.
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
                            <img src={image.original} alt={image.name} />
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
                        className={activeView === 'original' ? 'active' : ''}
                        onClick={() => setActiveView('original')}
                    >
                        Original Image
                    </button>
                    <button 
                        className={activeView === 'bbox' ? 'active' : ''}
                        onClick={() => setActiveView('bbox')}
                    >
                        Bounding Boxes
                    </button>
                    <button 
                        className={activeView === 'segmentation' ? 'active' : ''}
                        onClick={() => setActiveView('segmentation')}
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
                    <h3>{selectedImage.name} - {activeView.charAt(0).toUpperCase() + activeView.slice(1)}</h3>
                    <p className="view-description">
                        {getViewDescription()}
                    </p>
                    <div className="image-details">
                        <p><strong>Description:</strong> {selectedImage.description}</p>
                        <p><strong>Current View:</strong> {activeView.charAt(0).toUpperCase() + activeView.slice(1)} Analysis</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default InteractiveDemo;

