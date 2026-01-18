import React, { useState, useEffect, useMemo } from 'react';
import '../styles/SharkMatchViewer.css';
import mediaMatchesData from '../assets/data/json/GBIF_media_matches.json';
import sharkImageOccurrencesData from '../assets/data/json/GBIF_shark_image_occurrences_validated.json';
import MatchSharkSelector from './panels/MatchSharkSelector';

function SharkMatchViewer() {
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
        if (selectedSharkId) {
            filterImagesByShark(selectedSharkId);
        }
    }, [selectedSharkId]);

    // Create lookup from key to identifier (image URL) from media matches
    const keyToIdentifierLookup = useMemo(() => {
        const lookup = {};
        mediaMatchesData.forEach(media => {
            lookup[media.key] = media.identifier;
        });
        return lookup;
    }, []);

    // Group image occurrences by shark ID
    const imagesByShark = useMemo(() => {
        const grouped = {};
        sharkImageOccurrencesData.forEach(occurrence => {
            const sharkId = occurrence.identificationID;
            if (!grouped[sharkId]) {
                grouped[sharkId] = [];
            }
            // Enrich with identifier from media matches
            grouped[sharkId].push({
                ...occurrence,
                identifier: keyToIdentifierLookup[occurrence.key] || null
            });
        });
        return grouped;
    }, [keyToIdentifierLookup]);

    // Transform shark data from image occurrences - aggregate by shark ID
    const transformedSharks = useMemo(() => {
        const sharkMap = {};
        
        // Group all occurrences by shark ID and aggregate data
        sharkImageOccurrencesData.forEach(occurrence => {
            const sharkId = occurrence.identificationID;
            
            if (!sharkMap[sharkId]) {
                // Extract country and year from the occurrence
                const countryYear = occurrence['country (year)'] || '';
                const countryMatch = countryYear.match(/^([^(]+)/);
                const yearMatch = countryYear.match(/\((\d{4})\)/);
                const country = countryMatch ? countryMatch[1].trim() : '';
                const year = yearMatch ? yearMatch[1] : '';

                // Extract month from stateProvince field
                const stateProvince = occurrence['stateProvince - verbatimLocality (month year)'] || '';
                const monthMatch = stateProvince.match(/\((\w+)\s+\d{4}\)/);
                const month = monthMatch ? monthMatch[1] : '';
                
                // Parse MIEWID distance from match_distance field
                const miewidDistance = occurrence.match_distance;
                
                sharkMap[sharkId] = {
                    identificationID: sharkId,
                    whaleSharkID: occurrence.whaleSharkID,
                    'country (year)': occurrence['country (year)'],
                    'stateProvince - verbatimLocality (month year)': occurrence['stateProvince - verbatimLocality (month year)'],
                    'Oldest Occurrence': occurrence['Oldest Occurrence'],
                    'Newest Occurrence': occurrence['Newest Occurrence'],
                    miewid_distance: miewidDistance,
                    countries: country,
                    oldest: occurrence['Oldest Occurrence'] ? occurrence['Oldest Occurrence'].split('-')[0] : year,
                    newest: occurrence['Newest Occurrence'] ? occurrence['Newest Occurrence'].split('-')[0] : year,
                    months: month ? [month] : [],
                    occurrences: 1,
                    image: 'Yes',
                    plausibilities: []
                };
            }
            
            // Collect plausibilities for aggregation
            if (occurrence.plausibility) {
                sharkMap[sharkId].plausibilities.push(occurrence.plausibility);
            }
        });
        
        // Convert to array and aggregate plausibility
        return Object.values(sharkMap).map(shark => {
            const plausibilities = shark.plausibilities;
            const hasPlausible = plausibilities.includes('PLAUSIBLE');
            const hasUncertain = plausibilities.includes('UNCERTAIN');
            const hasImpossible = plausibilities.includes('IMPOSSIBLE');
            
            let aggregatedPlausibility = 'UNKNOWN';
            if (hasPlausible) aggregatedPlausibility = 'PLAUSIBLE';
            else if (hasUncertain) aggregatedPlausibility = 'UNCERTAIN';
            else if (hasImpossible) aggregatedPlausibility = 'IMPOSSIBLE';
            
            // Remove the temporary plausibilities array
            const { plausibilities: _, ...sharkWithoutTemp } = shark;
            
            return {
                ...sharkWithoutTemp,
                plausibility: aggregatedPlausibility
            };
        });
    }, []);

    const loadData = () => {
        try {
            setLoading(true);
            
            console.log('Loading shark data:', transformedSharks.length, 'unique sharks');
            console.log('Loading image occurrences:', sharkImageOccurrencesData.length, 'total records');
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
        // Get all image occurrences for this shark
        const images = imagesByShark[identificationID] || [];
        setSharkImages(images);
        setSelectedImage(images.length > 0 ? images[0] : null);
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
                        mediaMatches={sharkImageOccurrencesData}
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
                                            <p><strong>Image Key:</strong> {selectedImage.key}</p>
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
                                        <h5>MIEWID Matched Shark: {selectedImage.matched_shark_id}</h5>
                                        <div className="match-match-info">
                                            <p className="match-distance">
                                                <strong>Distance:</strong> 
                                                <span className={`match-distance-value ${parseFloat(selectedImage.match_distance) < 1.0 ? 'good' : 'moderate'}`}>
                                                    {selectedImage.match_distance}
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
                                            // Get all images for the matched shark ID
                                            const matchedImages = imagesByShark[selectedImage.matched_shark_id] || [];
                                            
                                            if (matchedImages.length > 0) {
                                                const [firstMatchedImage, ...otherMatchedImages] = matchedImages;
                                                return (
                                                    <>
                                                        {/* Main matched image */}
                                                        <img 
                                                            src={firstMatchedImage.identifier} 
                                                            alt="Matched shark main"
                                                            onError={(e) => e.target.src = '/placeholder-shark.png'}
                                                            style={{
                                                                width: '100%',
                                                                maxWidth: '400px',
                                                                height: 'auto',
                                                                borderRadius: '6px',
                                                                border: '2px solid #e0e0e0',
                                                                marginTop: '1rem'
                                                            }}
                                                        />
                                                        
                                                        {/* Matched shark thumbnails grid */}
                                                        {otherMatchedImages.length > 0 && (
                                                            <div className="match-query-images-grid">
                                                                <h6>All Matched Images ({matchedImages.length}):</h6>
                                                                <div className="match-query-images-thumbnails">
                                                                    {matchedImages.map((img, idx) => (
                                                                        <div 
                                                                            key={`matched-${idx}`} 
                                                                            className={`match-query-image-item ${idx === 0 ? 'active' : ''}`}
                                                                        >
                                                                            <img 
                                                                                src={img.identifier} 
                                                                                alt={`Matched ${idx + 1}`}
                                                                                onError={(e) => e.target.src = '/placeholder-shark.png'}
                                                                            />
                                                                            <div className="match-query-image-label">
                                                                                {idx + 1}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            } else {
                                                return <p className="match-no-matches">No images found for matched shark ID in dataset</p>;
                                            }
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
