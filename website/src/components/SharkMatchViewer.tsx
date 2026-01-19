import { useState, useEffect, useMemo } from "react";
import "../styles/SharkMatchViewer.css";

import mediaMatchesData from "../assets/data/json/GBIF_media_matches.json";

import { visionSharks, visionOccurrences } from "../utils/DataUtils";

import MatchSharkSelector from "./panels/MatchSharkSelector";
import { WhaleSharkEntryNormalized } from "types/sharks";


function SharkMatchViewer() {
    const [selectedSharkId, setSelectedSharkId] = useState<string>(null);
    const [selectedOccurrence, setSelectedOccurrence] = useState<WhaleSharkEntryNormalized>(null);
    const [occurrenceImgs, setOccurrenceImgs] = useState<WhaleSharkEntryNormalized[]>([]);

    useEffect(() => {
        if (selectedSharkId) {
            filterSharkOccurrenceImgs(selectedSharkId);
        }
    }, [selectedSharkId]);

    // Create lookup from key to identifier (image URL) from media matches
    const keyToIdentifierLookup = useMemo(() => {
        const lookup: Record<number, string> = {};
        mediaMatchesData.forEach(media => {
            lookup[media.key] = media.identifier;
        });
        return lookup;
    }, []);

    // Group image occurrences by shark ID
    const allOccurrenceImgs = useMemo(() => {
        const grouped: Record<string, WhaleSharkEntryNormalized[]> = {};
        
        visionOccurrences.forEach(occurrence => {
            const sharkId = occurrence.id;
            if (!grouped[sharkId]) {
                grouped[sharkId] = [];
            }
            grouped[sharkId].push(occurrence);
        });
        return grouped;
    }, []);

    const filterSharkOccurrenceImgs = (id: string) => {
        // Get all image occurrences for this shark
        const occurrences = allOccurrenceImgs[id] || [];

        setSelectedOccurrence(occurrences.length > 0 ? occurrences[0] : null);
        setOccurrenceImgs(occurrences);
    };

    const getSharkInfo = (id: string) => {
        return visionSharks.find(shark => shark.id === id);
    };

    const handleSharkSelect = (id: string) => {
        setSelectedSharkId(id);
    };

    const handleImageSelect = (occurrenceImage: WhaleSharkEntryNormalized) => {
        setSelectedOccurrence(occurrenceImage);
    };

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
                        sharks={visionSharks}
                        onSharkSelect={handleSharkSelect}
                        selectedSharkId={selectedSharkId}
                    />
                </div>

                {/* Main Viewer */}
                {selectedSharkId && (
                    <div className="match-viewer-main">
                        {/* Shark Info Header */}
                        <div className="match-info-header">
                            <h3>Shark: {sharkInfo?.id}</h3>
                            <div className="match-info-details">
                                <span><strong>Location:</strong> {sharkInfo?.countries}</span>
                                <span><strong>Date Range:</strong> {sharkInfo?.oldest} to {sharkInfo?.newest}</span>
                                <span><strong>Images:</strong> {occurrenceImgs.length}</span>
                            </div>
                        </div>

                        {/* Match Details */}
                        {selectedOccurrence && occurrenceImgs.length > 0 && (
                            <div className="match-details">
                                <h4>Match Information</h4>
                                <div className="match-container">
                                    <div className="match-query-image">
                                        <h5>Query Image</h5>
                                        <img 
                                            src={keyToIdentifierLookup[selectedOccurrence.mediaKey]} 
                                            alt="Query"
                                        />
                                        <div className="match-image-info">
                                            <p><strong>Query Shark ID:</strong> {selectedOccurrence.id}</p>
                                            <p><strong>Image Key:</strong> {selectedOccurrence.mediaKey}</p>
                                            <p><strong>Occurrence ID:</strong> {selectedOccurrence.occurrenceID}</p>
                                        </div>
                                        <div className="match-query-images-grid">
                                            <h6>All Query Images ({occurrenceImgs.length}):</h6>
                                            <div className="match-query-images-thumbnails">
                                                {occurrenceImgs.map((img, idx) => (
                                                    <div 
                                                        key={`query-${idx}`} 
                                                        className={`match-query-image-item ${selectedOccurrence === img ? "active" : ""}`}
                                                        onClick={() => handleImageSelect(img)}
                                                    >
                                                        <img 
                                                            src={keyToIdentifierLookup[img.mediaKey]} 
                                                            alt={`Query ${idx + 1}`}
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
                                        <h5>MIEWID Matched Shark: {selectedOccurrence.matched_shark_id}</h5>
                                        <div className="match-match-info">
                                            <p className="match-distance">
                                                <strong>Distance:</strong> 
                                                <span className={`match-distance-value ${selectedOccurrence.miewid_match_distance < 1.0 ? "good" : "moderate"}`}>
                                                    {selectedOccurrence.miewid_match_distance}
                                                </span>
                                            </p>
                                            {selectedOccurrence.plausibility && (
                                                <p className="match-plausibility-display">
                                                    <strong>Plausibility:</strong> 
                                                    <span className={`match-plausibility plausibility-${selectedOccurrence.plausibility.toLowerCase()}`}>
                                                        {selectedOccurrence.plausibility}
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
                                            const matchedSharkOccurrences = allOccurrenceImgs[selectedOccurrence.matched_shark_id] || [];
                                            
                                            if (matchedSharkOccurrences.length > 0) {
                                                const [firstMatchedImage, ...otherMatchedImages] = matchedSharkOccurrences;
                                                return (
                                                    <>
                                                        {/* Main matched image */}
                                                        <img 
                                                            src={keyToIdentifierLookup[firstMatchedImage.mediaKey]} 
                                                            alt="Matched shark main"
                                                            style={{
                                                                width: "100%",
                                                                maxWidth: "400px",
                                                                height: "auto",
                                                                borderRadius: "6px",
                                                                border: "2px solid #e0e0e0",
                                                                marginTop: "1rem"
                                                            }}
                                                        />
                                                        
                                                        {/* Matched shark thumbnails grid */}
                                                        {otherMatchedImages.length > 0 && (
                                                            <div className="match-query-images-grid">
                                                                <h6>All Matched Images ({matchedSharkOccurrences.length}):</h6>
                                                                <div className="match-query-images-thumbnails">
                                                                    {matchedSharkOccurrences.map((img, idx) => (
                                                                        <div 
                                                                            key={`matched-${idx}`} 
                                                                            className={`match-query-image-item ${idx === 0 ? "active" : ""}`}
                                                                        >
                                                                            <img 
                                                                                src={keyToIdentifierLookup[img.mediaKey]} 
                                                                                alt={`Matched ${idx + 1}`}
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
                                            } 
                                            else {
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

