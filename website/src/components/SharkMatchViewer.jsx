import React, { useState, useEffect } from 'react';
import '../styles/SharkMatchViewer.css';
import mediaMatchesData from '../assets/data/json/GBIF_media_matches.json';
import sharkMatchesData from '../assets/data/json/GBIF_shark_matches.json';

function SharkMatchViewer() {
    const [mediaMatches, setMediaMatches] = useState([]);
    const [sharkMatches, setSharkMatches] = useState([]);
    const [selectedSharkId, setSelectedSharkId] = useState(null);
    const [sharkImages, setSharkImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedSharkId && mediaMatches.length > 0) {
            filterImagesByShark(selectedSharkId);
        }
    }, [selectedSharkId, mediaMatches]);

    const loadData = () => {
        try {
            setLoading(true);
            
            console.log('Loading media matches:', mediaMatchesData.length, 'records');
            setMediaMatches(mediaMatchesData);
            
            console.log('Loading shark matches:', sharkMatchesData.length, 'records');
            setSharkMatches(sharkMatchesData);

            setLoading(false);
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load data: ' + err.message);
            setLoading(false);
        }
    };

    const filterImagesByShark = (identificationID) => {
        const filtered = mediaMatches.filter(
            record => record.identificationID === identificationID
        );
        setSharkImages(filtered);
        setSelectedImage(filtered.length > 0 ? filtered[0] : null);
    };

    const getSharkInfo = (identificationID) => {
        return sharkMatches.find(shark => shark.identificationID === identificationID);
    };

    const handleSharkSelect = (identificationID) => {
        setSelectedSharkId(identificationID);
    };

    const handleImageSelect = (image) => {
        setSelectedImage(image);
    };

    if (loading) {
        return <div className="shark-match-viewer loading">Loading data...</div>;
    }

    if (error) {
        return <div className="shark-match-viewer error">{error}</div>;
    }

    const sharkInfo = selectedSharkId ? getSharkInfo(selectedSharkId) : null;

    return (
        <div className="shark-match-viewer">
            <h2>Shark Image Match Viewer</h2>
            <p className="viewer-description">
                Explore whale shark identifications and their matched images using MIEWID embeddings
            </p>

            <div className="viewer-container">
                {/* Shark Selection Panel */}
                <div className="shark-selector-panel">
                    <h3>Select a Shark</h3>
                    <div className="shark-list">
                        {sharkMatches.slice(0, 50).map((shark, idx) => (
                            <div
                                key={shark.identificationID || `shark-${idx}`}
                                className={`shark-item ${selectedSharkId === shark.identificationID ? 'selected' : ''}`}
                                onClick={() => handleSharkSelect(shark.identificationID)}
                            >
                                <div className="shark-id">ID: {shark.whaleSharkID || 'N/A'}</div>
                                <div className="shark-meta">
                                    {shark['country (year)'] || 'Unknown'} | {shark['Oldest Occurrence'] || 'N/A'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Viewer */}
                {selectedSharkId && (
                    <div className="match-viewer-main">
                        {/* Shark Info Header */}
                        <div className="shark-info-header">
                            <h3>Shark: {sharkInfo?.whaleSharkID}</h3>
                            <div className="shark-details">
                                <span><strong>Location:</strong> {sharkInfo?.['country (year)']}</span>
                                <span><strong>Date Range:</strong> {sharkInfo?.['Oldest Occurrence']} to {sharkInfo?.['Newest Occurrence']}</span>
                                <span><strong>Images:</strong> {sharkImages.length}</span>
                            </div>
                        </div>

                        {/* Image Thumbnails */}
                        <div className="image-thumbnails">
                            <h4>Images for this Shark</h4>
                            <div className="thumbnail-grid">
                                {sharkImages.map((image, idx) => (
                                    <div
                                        key={`${image.occurrenceID}-${idx}`}
                                        className={`thumbnail ${selectedImage === image ? 'selected' : ''}`}
                                        onClick={() => handleImageSelect(image)}
                                    >
                                        <img 
                                            src={image.identifier} 
                                            alt={`Shark ${idx + 1}`}
                                            onError={(e) => e.target.src = '/placeholder-shark.png'}
                                        />
                                        <div className="thumbnail-label">Image {idx + 1}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Match Details */}
                        {selectedImage && (
                            <div className="match-details">
                                <h4>Match Information</h4>
                                <div className="match-container">
                                    <div className="query-image">
                                        <h5>Query Image</h5>
                                        <img 
                                            src={selectedImage.identifier} 
                                            alt="Query"
                                            onError={(e) => e.target.src = '/placeholder-shark.png'}
                                        />
                                        <div className="image-info">
                                            <p><strong>Occurrence ID:</strong> {selectedImage.occurrenceID}</p>
                                            <p><strong>Format:</strong> {selectedImage.format}</p>
                                        </div>
                                    </div>

                                    <div className="match-arrow">→</div>

                                    <div className="matched-image">
                                        <h5>MIEWID Closest Match</h5>
                                        <div className="match-info">
                                            <p><strong>Matched Shark ID:</strong> {selectedImage.miewid_closest_whale_shark_id}</p>
                                            <p><strong>Matched Image ID:</strong> {selectedImage.miewid_matched_image_id}</p>
                                            <p><strong>Matched Annotation ID:</strong> {selectedImage.miewid_matched_annotation_id}</p>
                                            <p className="distance">
                                                <strong>Distance:</strong> 
                                                <span className={`distance-value ${parseFloat(selectedImage.miewid_distance) < 1.0 ? 'good' : 'moderate'}`}>
                                                    {selectedImage.miewid_distance}
                                                </span>
                                            </p>
                                            <div className="distance-legend">
                                                <small>
                                                    Distance Scale: 0.0 = Perfect match | 0.5-1.0 = Very similar | 1.0-2.0 = Moderate | 2.0+ = Different
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!selectedSharkId && (
                    <div className="no-selection">
                        <p>Select a shark from the list to view its images and matches</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SharkMatchViewer;
