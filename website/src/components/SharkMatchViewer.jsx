import React, { useState, useEffect, useMemo } from 'react';
import '../styles/SharkMatchViewer.css';
import mediaMatchesData from '../assets/data/json/GBIF_media_matches.json';
import sharkMatchesData from '../assets/data/json/GBIF_shark_matches.json';
import MatchSharkSelector from './panels/MatchSharkSelector.jsx';

function SharkMatchViewer() {
    const [mediaMatches, setMediaMatches] = useState([]);
    const [sharkMatches, setSharkMatches] = useState([]);
    const [filteredSharkMatches, setFilteredSharkMatches] = useState([]);
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

    // Transform shark matches data to be compatible with filters
    const transformedSharks = useMemo(() => {
        return sharkMatchesData.map(shark => {
            // Parse MIEWID distance from formatted string
            const miewidMatch = shark['MIEWID: closest_whale_shark_id (matched_image_id, distance)'];
            const miewidDistanceMatch = miewidMatch?.match(/\((\d+),\s*([\d.]+)\)/);
            const miewidDistance = miewidDistanceMatch ? parseFloat(miewidDistanceMatch[2]) : null;

            // Extract country and year
            const countryYear = shark['country (year)'] || '';
            const countryMatch = countryYear.match(/^([^(]+)/);
            const yearMatch = countryYear.match(/\((\d{4})\)/);
            const country = countryMatch ? countryMatch[1].trim() : '';
            const year = yearMatch ? yearMatch[1] : '';

            // Extract month from stateProvince field
            const stateProvince = shark['stateProvince - verbatimLocality (month year)'] || '';
            const monthMatch = stateProvince.match(/\((\w+)\s+\d{4}\)/);
            const month = monthMatch ? monthMatch[1] : '';

            return {
                ...shark,
                miewid_distance: miewidDistance,
                countries: country,
                oldest: shark['Oldest Occurrence'] ? shark['Oldest Occurrence'].split('-')[0] : year,
                newest: shark['Newest Occurrence'] ? shark['Newest Occurrence'].split('-')[0] : year,
                months: month ? [month] : [],
                occurrences: 1, // Default value since we don't have this data
                image: 'Yes', // These sharks have images from GBIF
            };
        });
    }, []);

    const loadData = () => {
        try {
            setLoading(true);
            
            console.log('Loading media matches:', mediaMatchesData.length, 'records');
            setMediaMatches(mediaMatchesData);
            
            console.log('Loading shark matches:', transformedSharks.length, 'records');
            setSharkMatches(transformedSharks);
            setFilteredSharkMatches(transformedSharks);

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

    const handleNextImage = () => {
        if (sharkImages.length === 0) return;
        const currentIndex = sharkImages.indexOf(selectedImage);
        const nextIndex = (currentIndex + 1) % sharkImages.length;
        setSelectedImage(sharkImages[nextIndex]);
    };

    const handlePrevImage = () => {
        if (sharkImages.length === 0) return;
        const currentIndex = sharkImages.indexOf(selectedImage);
        const prevIndex = (currentIndex - 1 + sharkImages.length) % sharkImages.length;
        setSelectedImage(sharkImages[prevIndex]);
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
                    <MatchSharkSelector
                        sharks={sharkMatches}
                        onSharkSelect={handleSharkSelect}
                        selectedSharkId={selectedSharkId}
                        onFilteredSharksChange={setFilteredSharkMatches}
                    />
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

                        {/* Match Details */}
                        {selectedImage && sharkImages.length > 0 && (
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
                                            <p><strong>Query Shark ID:</strong> {selectedImage.identificationID}</p>
                                            <p><strong>Query Image ID:</strong> {selectedImage.query_index}</p>
                                            <p><strong>Occurrence ID:</strong> {selectedImage.occurrenceID}</p>
                                        </div>
                                        <div className="query-images-grid">
                                            <h6>All Query Images ({sharkImages.length}):</h6>
                                            <div className="query-images-thumbnails">
                                                {sharkImages.map((img, idx) => (
                                                    <div 
                                                        key={`query-${idx}`} 
                                                        className={`query-image-item ${selectedImage === img ? 'active' : ''}`}
                                                        onClick={() => handleImageSelect(img)}
                                                    >
                                                        <img 
                                                            src={img.identifier} 
                                                            alt={`Query ${idx + 1}`}
                                                            onError={(e) => e.target.src = '/placeholder-shark.png'}
                                                        />
                                                        <div className="query-image-label">
                                                            {idx + 1}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="match-arrow">→</div>

                                    <div className="matched-images">
                                        <h5>MIEWID Matched Shark: {selectedImage.miewid_closest_whale_shark_id}</h5>
                                        <div className="match-info">
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
                                        {(() => {
                                            const matchedImages = mediaMatches.filter(
                                                img => img.identificationID === selectedImage.miewid_closest_whale_shark_id
                                            );
                                            
                                            return matchedImages.length > 0 ? (
                                                <div className="matched-images-grid">
                                                    {matchedImages.map((img, idx) => (
                                                        <div key={`matched-${idx}`} className="matched-image-item">
                                                            <img 
                                                                src={img.identifier} 
                                                                alt={`Matched shark ${idx + 1}`}
                                                                onError={(e) => e.target.src = '/placeholder-shark.png'}
                                                            />
                                                            <div className="matched-image-label">
                                                                Image {idx + 1}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="no-matches">No images found for matched shark ID in dataset</p>
                                            );
                                        })()}
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
