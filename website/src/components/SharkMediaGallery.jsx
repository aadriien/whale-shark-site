import React, { useState, useEffect } from "react";
import { parseImageField } from "../utils/DataUtils.js";


const SharkMediaGallery = ({ shark }) => {
    const [expandedImageIndex, setExpandedImageIndex] = useState(null);

    const images = shark && shark.image !== "Unknown" ? parseImageField(shark.image) : [];

    // Open lightbox with image index, not just image object
    const openImage = (index) => setExpandedImageIndex(index);
    const closeImage = () => setExpandedImageIndex(null);

    // Keyboard navigation for image carousel 
    useEffect(() => {
        if (expandedImageIndex === null) return;

        const handleKeyDown = (e) => {
            if (e.key === "ArrowLeft") {
                setExpandedImageIndex((idx) => Math.max(idx - 1, 0));
            } 
            else if (e.key === "ArrowRight") {
                setExpandedImageIndex((idx) => Math.min(idx + 1, images.length - 1));
            } 
            else if (e.key === "Escape") {
                closeImage();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
        
    }, [expandedImageIndex, images.length]);

    return (
        <>
            <div className="shark-images-container">
                <h3>Media Gallery</h3>
                {images.length > 0 ? (
                    images.map((img, idx) => (
                        <div key={idx} className="shark-image-card">
                            <img 
                                src={img.url} 
                                alt={`Shark image ${idx}`} 
                                onClick={() => openImage(idx)}
                                style={{ cursor: "pointer" }}
                            />
                            <p className="shark-image-meta">
                                <small>📸 Creator: {img.creator} | {img.license}</small>
                            </p>
                        </div>
                    ))
                ) : (
                    <p>No media available.</p>
                )}
            </div>

            {/* Lightbox Overlay */}
            {expandedImageIndex !== null && (
                <div className="image-overlay" onClick={closeImage}>
                    <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="carousel-button left"
                            onClick={() => setExpandedImageIndex(prev => Math.max(prev - 1, 0))}
                            disabled={expandedImageIndex === 0}
                        >
                            &lt; {/* Left arrow for image carousel */}
                        </button>

                        <div className="overlay-image-wrapper">
                            <img 
                                src={images[expandedImageIndex].url} 
                                alt={`Expanded shark image ${expandedImageIndex}`} 
                            />
                            <p className="overlay-meta">
                                📸 Creator: {images[expandedImageIndex].creator} | {images[expandedImageIndex].license}
                            </p>
                        </div>

                        <button
                            className="carousel-button right"
                            onClick={() => setExpandedImageIndex(prev => Math.min(prev + 1, images.length - 1))}
                            disabled={expandedImageIndex === images.length - 1}
                        >
                            &gt; {/* Right arrow for image carousel */}
                        </button>

                        <button className="close-button" onClick={closeImage}>X</button>
                    </div>
                </div>
            )}
        </>
    );
};

export default SharkMediaGallery;

