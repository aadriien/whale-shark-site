import { useState, useEffect } from "react";

import { 
    mediaSharks, 
    visionSharks, visionOccurrences, 
    parseImageField 
} from "../utils/DataUtils";

import MatchSharkSelector from "./panels/MatchSharkSelector";

import { ImageMetadata, ImagesWithMetadata } from "types/sharks";


function SharkMatchViewer() {
    const [selectedSharkId, setSelectedSharkId] = useState<string>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
    const [occurrenceImgs, setOccurrenceImgs] = useState<ImagesWithMetadata>([]);
    const [selectedMatchedImage, setSelectedMatchedImage] = useState<ImageMetadata>(null);

    // Get images for a shark from mediaSharks
    const getSharkImages = (sharkId: string) => {
        const shark = mediaSharks.find(s => s.id === sharkId);
        if (!shark || !shark.image) return [];
        return parseImageField(shark.image);
    };

    useEffect(() => {
        if (selectedSharkId) {
            const images = getSharkImages(selectedSharkId);
            setOccurrenceImgs(images);
            setSelectedImageIndex(0);
        }
    }, [selectedSharkId]);

    useEffect(() => {
        if (selectedSharkId) {
            // Get all occurrences for this shark, then get selected from index
            const sharkOccurrences = visionOccurrences.filter(
                occ => occ.id === selectedSharkId
            );
            const occurrence = sharkOccurrences[selectedImageIndex];
            
            if (occurrence?.matched_shark_id) {
                const matchedImages = getSharkImages(occurrence.matched_shark_id);
                setSelectedMatchedImage(matchedImages.length > 0 ? matchedImages[0] : null);
            }
        }
    }, [selectedSharkId, selectedImageIndex]);

    const getSharkInfo = (id: string) => {
        return visionSharks.find(shark => shark.id === id);
    };

    const handleSharkSelect = (id: string) => {
        setSelectedSharkId(id);
    };

    const sharkInfo = selectedSharkId ? getSharkInfo(selectedSharkId) : null;

    return (
        <div className="shark-match-viewer">
            <h2>Shark Image Match Viewer</h2>
            <p className="match-viewer-description">
                Explore whale shark identifications and their matched images using MiewID embeddings
            </p>

            <div className="match-viewer-container">
                {/* Shark Selection Panel */}
                <div className="match-selector-panel">
                    <MatchSharkSelector
                        sharks={visionSharks}
                        onSharkSelect={handleSharkSelect}
                        selectedSharkId={selectedSharkId}
                    />
                </div>

                {/* Main Viewer */}
                <div className="match-viewer-main">
                    {selectedSharkId && occurrenceImgs.length > 0 ? (
                        <>
                            {/* Match Stats Banner */}
                                <div className="match-info-banner">
                                    {(() => {
                                        const sharkOccurrences = visionOccurrences.filter(occ => occ.id === selectedSharkId);
                                        const occurrence = sharkOccurrences[selectedImageIndex];
                                        return (
                                            <div className="match-stats-group">
                                                <div className="match-stats-left">
                                                    <span className="match-stat-pair">
                                                        <span className={`match-distance-value ${occurrence?.miewid_match_distance < 1.0 ? "good" : "moderate"}`}>
                                                            {occurrence?.miewid_match_distance || 'N/A'}
                                                        </span>
                                                    </span>
                                                    {occurrence?.plausibility && (
                                                        <span className="match-stat-pair">
                                                            <span className={`match-plausibility plausibility-${occurrence.plausibility.toLowerCase()}`}>
                                                                {occurrence.plausibility}
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="match-distance-legend-inline">
                                                    <small>
                                                        Distance Scale: 0.0 = Perfect match | 0.5-1.0 = Very similar | 1.0-2.0 = Moderate | 2.0+ = Different
                                                    </small>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div className="match-details">
                                    <div className="match-container">
                                    {/* Query Shark Box */}
                                    <div className="match-shark-box">
                                        <div className="match-shark-info-box">
                                            <div className="match-shark-id-row">
                                                <span className="match-shark-label">QUERY SHARK ID:</span>
                                                <span className="match-shark-id-value">{sharkInfo?.id}</span>
                                            </div>
                                            <div className="match-shark-details-row">
                                                <span className="match-shark-meta">{sharkInfo?.countries}</span>
                                                <span className="match-shark-meta">({sharkInfo?.oldest} to {sharkInfo?.newest})</span>
                                            </div>
                                        </div>
                                        <div className="image-wrapper-large">
                                            <img 
                                                src={occurrenceImgs[selectedImageIndex]?.url} 
                                                alt="Query"
                                                className="match-main-image"
                                            />
                                            <p className="shark-image-meta">
                                                <small>📸 Creator: {occurrenceImgs[selectedImageIndex]?.creator} | {occurrenceImgs[selectedImageIndex]?.license}</small>
                                            </p>
                                        </div>
                                        <div className="match-images-grid">
                                            <h6>All Images for Query Shark ({occurrenceImgs.length}):</h6>
                                            {occurrenceImgs.length > 1 ? (
                                                <div className="match-thumbnails">
                                                    {occurrenceImgs.map((img, idx) => (
                                                        <div 
                                                            key={`query-${idx}`} 
                                                            className={`match-thumbnail-item ${selectedImageIndex === idx ? "active" : ""}`}
                                                            onClick={() => setSelectedImageIndex(idx)}
                                                        >
                                                            <img src={img.url} alt={`Query ${idx + 1}`} />
                                                            <div className="match-thumbnail-label">{idx + 1}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="match-no-other-images">No other images for this whale shark</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Matched Shark Box */}
                                    <div className="match-shark-box">
                                        {(() => {
                                            const sharkOccurrences = visionOccurrences.filter(occ => occ.id === selectedSharkId);
                                            const occurrence = sharkOccurrences[selectedImageIndex];
                                            const matchedShark = visionSharks.find(s => s.id === occurrence?.matched_shark_id);
                                            
                                            if (!occurrence?.matched_shark_id) {
                                                return <p className="match-no-matches">No match data available</p>;
                                            }
                                            
                                            const matchedImages = getSharkImages(occurrence.matched_shark_id);
                                            
                                            if (matchedImages.length === 0) {
                                                return <p className="match-no-matches">No images found for matched shark ID</p>;
                                            }
                                            
                                            return (
                                                <>
                                                    <div className="match-shark-info-box">
                                                        <div className="match-shark-id-row">
                                                            <span className="match-shark-label">MATCHED SHARK ID:</span>
                                                            <span className="match-shark-id-value">{occurrence?.matched_shark_id}</span>
                                                        </div>
                                                        <div className="match-shark-details-row">
                                                            <span className="match-shark-meta">{matchedShark?.countries}</span>
                                                            <span className="match-shark-meta">({matchedShark?.oldest} to {matchedShark?.newest})</span>
                                                        </div>
                                                    </div>
                                                    <div className="image-wrapper-large">
                                                        <img 
                                                            src={selectedMatchedImage?.url || matchedImages[0].url} 
                                                            alt="Matched shark main"
                                                            className="match-main-image"
                                                        />
                                                        <p className="shark-image-meta">
                                                            <small>📸 Creator: {selectedMatchedImage?.creator || matchedImages[0].creator} | {selectedMatchedImage?.license || matchedImages[0].license}</small>
                                                        </p>
                                                    </div>
                                                    <div className="match-images-grid">
                                                        <h6>All Images for Matched Shark ({matchedImages.length}):</h6>
                                                        {matchedImages.length > 1 ? (
                                                            <div className="match-thumbnails">
                                                                {matchedImages.map((img, idx) => (
                                                                    <div 
                                                                        key={`matched-${idx}`} 
                                                                        className={`match-thumbnail-item ${selectedMatchedImage?.url === img.url ? "active" : ""}`}
                                                                        onClick={() => setSelectedMatchedImage(img)}
                                                                    >
                                                                        <img src={img.url} alt={`Matched ${idx + 1}`} />
                                                                        <div className="match-thumbnail-label">{idx + 1}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="match-no-other-images">No other images for this whale shark</p>
                                                        )}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="match-no-selection">
                            <p>Select a shark from the list to view its images and matches</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SharkMatchViewer;

