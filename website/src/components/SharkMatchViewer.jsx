import React, { useState, useEffect, useMemo } from 'react';
import '../styles/SharkMatchViewer.css';
import mediaMatchesData from '../assets/data/json/GBIF_media_matches.json';
import mediaMatchesValidatedData from '../assets/data/json/GBIF_media_matches_validated.json';
import sharkMatchesData from '../assets/data/json/GBIF_shark_matches_validated.json';
import sharkImageOccurrencesData from '../assets/data/json/GBIF_shark_image_occurrences_validated.json';
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

    // Create lookup for plausibility from exploded occurrences (has per-image match plausibility)
    const mediaPlausibilityLookup = useMemo(() => {
        const lookup = {};
        sharkImageOccurrencesData.forEach(occurrence => {
            const key = String(occurrence.key); // Convert to string for consistent lookup
            if (key) {
                lookup[key] = {
                    plausibility: occurrence.plausibility,
                    distance_km: occurrence.distance_km,
                    days_between: occurrence.days_between,
                    implied_speed_km_per_day: occurrence.implied_speed_km_per_day,
                    matched_shark_id: occurrence.matched_shark_id
                };
            }
        });
        return lookup;
    }, []);

    // Create a lookup for plausibility data from the exploded occurrences file
    const plausibilityLookup = useMemo(() => {
        const lookup = {};
        sharkImageOccurrencesData.forEach(occurrence => {
            const sharkId = occurrence.identificationID;
            const imageId = occurrence.key;
            
            if (!lookup[sharkId]) {
                lookup[sharkId] = {};
            }
            
            // Store plausibility info per image for this shark
            if (imageId) {
                lookup[sharkId][imageId] = {
                    plausibility: occurrence.plausibility,
                    matched_shark_id: occurrence.matched_shark_id,
                    distance_km: occurrence.distance_km,
                    days_between: occurrence.days_between,
                    implied_speed_km_per_day: occurrence.implied_speed_km_per_day
                };
            }
        });
        return lookup;
    }, []);

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
            
            // Get plausibility data for this shark's images
            const sharkId = shark.identificationID;
            const sharkPlausibilityData = plausibilityLookup[sharkId] || {};
            
            // Aggregate plausibility - use the best (most plausible) match for filtering
            const plausibilities = Object.values(sharkPlausibilityData).map(d => d.plausibility);
            const hasPlausible = plausibilities.includes('PLAUSIBLE');
            const hasUncertain = plausibilities.includes('UNCERTAIN');
            const hasImpossible = plausibilities.includes('IMPOSSIBLE');
            
            let aggregatedPlausibility = 'UNKNOWN';
            if (hasPlausible) aggregatedPlausibility = 'PLAUSIBLE';
            else if (hasUncertain) aggregatedPlausibility = 'UNCERTAIN';
            else if (hasImpossible) aggregatedPlausibility = 'IMPOSSIBLE';

            return {
                ...shark,
                miewid_distance: miewidDistance,
                countries: country,
                oldest: shark['Oldest Occurrence'] ? shark['Oldest Occurrence'].split('-')[0] : year,
                newest: shark['Newest Occurrence'] ? shark['Newest Occurrence'].split('-')[0] : year,
                months: month ? [month] : [],
                occurrences: 1,
                image: 'Yes',
                plausibility: aggregatedPlausibility,
                plausibilityData: sharkPlausibilityData // Store for per-image lookup
            };
        });
    }, [plausibilityLookup]);

    const loadData = () => {
        try {
            setLoading(true);
            
            // Enrich media matches with plausibility data
            const enrichedMediaMatches = mediaMatchesData.map(media => {
                const plausibilityData = mediaPlausibilityLookup[String(media.key)] || {};
                return {
                    ...media,
                    plausibility: plausibilityData.plausibility || 'UNKNOWN',
                    distance_km: plausibilityData.distance_km,
                    days_between: plausibilityData.days_between,
                    implied_speed_km_per_day: plausibilityData.implied_speed_km_per_day
                };
            });
            
            console.log('Loading media matches:', enrichedMediaMatches.length, 'records');
            setMediaMatches(enrichedMediaMatches);
            
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
            record => String(record.identificationID) === String(identificationID)
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
            <p className="match-viewer-description">
                Explore whale shark identifications and their matched images using MIEWID embeddings
            </p>

            <div className="match-viewer-container">
                {/* Shark Selection Panel */}
                <div className="match-selector-panel">
                    <MatchSharkSelector
                        sharks={sharkMatches}
                        mediaMatches={mediaMatches}
                        onSharkSelect={handleSharkSelect}
                        selectedSharkId={selectedSharkId}
                        onFilteredSharksChange={setFilteredSharkMatches}
                    />
                </div>

                {/* Main Viewer */}
                {selectedSharkId && (
                    <div className="match-viewer-main">
                        {/* Shark Info Header */}
                        <div className="match-info-header">
                            <h3>Shark: {sharkInfo?.whaleSharkID}</h3>
                            <div className="match-info-details">
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
                                    <div className="match-query-image">
                                        <h5>Query Image</h5>
                                        <img 
                                            src={selectedImage.identifier} 
                                            alt="Query"
                                            onError={(e) => e.target.src = '/placeholder-shark.png'}
                                        />
                                        <div className="match-image-info">
                                            <p><strong>Query Shark ID:</strong> {selectedImage.identificationID}</p>
                                            <p><strong>Query Image ID:</strong> {selectedImage.query_index}</p>
                                            <p><strong>Occurrence ID:</strong> {selectedImage.occurrenceID}</p>
                                        </div>
                                        <div className="match-query-images-grid">
                                            <h6>All Query Images ({sharkImages.length}):</h6>
                                            <div className="match-query-images-thumbnails">
                                                {sharkImages.map((img, idx) => (
                                                    <div 
                                                        key={`query-${idx}`} 
                                                        className={`match-query-image-item ${selectedImage === img ? 'active' : ''}`}
                                                        onClick={() => handleImageSelect(img)}
                                                    >
                                                        <img 
                                                            src={img.identifier} 
                                                            alt={`Query ${idx + 1}`}
                                                            onError={(e) => e.target.src = '/placeholder-shark.png'}
                                                        />
                                                        <div className="match-query-image-label">
                                                            {idx + 1}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="match-arrow">→</div>

                                    <div className="match-matched-images">
                                        <h5>MIEWID Matched Shark: {selectedImage.miewid_closest_whale_shark_id}</h5>
                                        <div className="match-match-info">
                                            <p className="match-distance">
                                                <strong>Distance:</strong> 
                                                <span className={`match-distance-value ${parseFloat(selectedImage.miewid_distance) < 1.0 ? 'good' : 'moderate'}`}>
                                                    {selectedImage.miewid_distance}
                                                </span>
                                            </p>
                                            {selectedImage.plausibility && (
                                                <p className="match-plausibility-display">
                                                    <strong>Plausibility:</strong> 
                                                    <span className={`match-plausibility plausibility-${selectedImage.plausibility.toLowerCase()}`}>
                                                        {selectedImage.plausibility}
                                                    </span>
                                                </p>
                                            )}
                                            <div className="match-distance-legend">
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
                                                <div className="match-matched-images-grid">
                                                    {matchedImages.map((img, idx) => (
                                                        <div key={`matched-${idx}`} className="match-matched-image-item">
                                                            <img 
                                                                src={img.identifier} 
                                                                alt={`Matched shark ${idx + 1}`}
                                                                onError={(e) => e.target.src = '/placeholder-shark.png'}
                                                            />
                                                            <div className="match-matched-image-label">
                                                                Image {idx + 1}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="match-no-matches">No images found for matched shark ID in dataset</p>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!selectedSharkId && (
                    <div className="match-no-selection">
                        <p>Select a shark from the list to view its images and matches</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SharkMatchViewer;
