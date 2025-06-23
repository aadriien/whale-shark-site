import React, { useState } from "react";

import { getDate, parseSpecificRegion, parseRemarks, parseImageField } from "../utils/DataUtils.js";

const SharkInfoPanel = ({ shark }) => {
    const [expandedImageIndex, setExpandedImageIndex] = useState(null);

    if (!shark) {
        return (
            <div className="shark-info-panel">
                <h2>All Sharks Overview</h2>
                <p>Select a shark to view detailed tracking information.</p>
            </div>
        );
    }

    const images = shark.image === "Unknown" ? [] : parseImageField(shark.image);

    const countries = shark.countries.split(",").map(s => s.trim());
    const regions = shark.regions ? shark.regions.split(",").map(s => s.trim()) : [];
    const publishing = shark.publishing ? shark.publishing.split(",").map(s => s.trim()) : [];
    const remarks = shark.remarks ? shark.remarks.split(",").map(s => s.trim()) : [];
    
    return (
        <div className="shark-info-panel">
            <h2>ID: {shark.id}</h2>

            <div className="shark-panel-details">
                <div className="shark-traits">
                    <p className="shark-details"><strong>Sex:</strong>&nbsp; {shark.sex}</p>
                    <p className="shark-details"><strong>Life Stage:</strong>&nbsp; {shark.lifeStage}</p>
                </div>

                <div className="shark-records">
                    <h3 className="shark-details"><strong>Total Records:</strong>&nbsp; {shark.occurrences}</h3>
                    <p className="shark-details">
                        {shark.oldest} &nbsp;...&nbsp; {shark.newest}
                    </p>
                    <p className="shark-details">
                        <strong>Satellite tracking:</strong>&nbsp;&nbsp;
                        {Math.round(
                            (shark.machine / (shark.machine + shark.human)
                        ) * 100)}%
                    </p>
                    <p className="shark-details">
                        <strong>Human sightings:</strong>&nbsp;&nbsp;
                        {Math.round(
                            (shark.human / (shark.machine + shark.human)
                        ) * 100)}%
                    </p>
                </div>

                <div className="shark-regions">
                    <h3 className="shark-details">Places Visited</h3>
                    <ul className="timeline-list">
                        {countries.map((country, index) => {
                            const regionEntry = regions[index] || "Unknown";
                            const publishingEntry = publishing[index] || "Unspecified";
                            const remarksEntry = remarks[index] || "None";
                      
                            const regionDate = getDate(regionEntry);
                            const fallbackDate = getDate(country);
                            const displayDate = regionDate !== "Unknown" ? regionDate : fallbackDate;

                            return (
                                <li key={index} className="timeline-item">
                                    <div className="timeline-header">
                                        <strong>{parseSpecificRegion(country)}</strong>
                                        {" "}
                                        <span className="timeline-date">({displayDate})</span>
                                    </div>
                                    <div className="timeline-region">
                                        <span className="timeline-label">Region:</span>
                                        {" "}
                                        <em>{regionEntry !== "Unknown" ? parseSpecificRegion(regionEntry) : "Unspecified"}</em>
                                    </div>
                                    <div className="timeline-meta">
                                        <span className="timeline-label">Published by:</span>
                                        {" "}
                                        <em>{publishingEntry !== "Unknown" ? publishingEntry : "Unspecified"}</em>
                                    </div>
                                    <div className="timeline-remarks">
                                        <span className="timeline-label">Sighting remarks:</span> 
                                        {" "}
                                        <em>{remarksEntry !== "Unknown" ? parseRemarks(remarksEntry)  : "None"}</em>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className="shark-images-container">
                    <h3>Media Gallery</h3>
                    {images.length > 0 ? (
                        images.map((img, idx) => (
                            <div key={idx} className="shark-image-card">
                                <img 
                                    src={img.url} 
                                    alt={`Shark image ${idx}`} 
                                    onClick={() => setExpandedImageIndex(idx)}
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

            </div>

            {expandedImageIndex !== null && (
                <div className="image-overlay" onClick={() => setExpandedImageIndex(null)}>
                    <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="carousel-button left"
                            onClick={() => setExpandedImageIndex(prev => Math.max(prev - 1, 0))}
                            disabled={expandedImageIndex === 0}
                        >
                            ‹
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
                            ›
                        </button>

                        <button className="close-button" onClick={() => setExpandedImageIndex(null)}>X</button>
                    </div>
                </div>
            )}

        </div>
    );
}
        
export default SharkInfoPanel;
        