import { useState, useEffect } from "react";
import "../styles/SharkMatchViewer.css";

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
                        {occurrenceImgs.length > 0 && (
                            <div className="match-details">
                                <h4>Match Information</h4>
                                <div className="match-container">
                                    <div className="match-query-image">
                                        <h5>Query Image</h5>
                                        <img 
                                            src={occurrenceImgs[selectedImageIndex]?.url} 
                                            alt="Query"
                                        />
                                        <div className="match-image-info">
                                            <p><strong>Query Shark ID:</strong> {selectedSharkId}</p>
                                        </div>
                                        <div className="match-query-images-grid">
                                            <h6>All Query Images ({occurrenceImgs.length}):</h6>
                                            <div className="match-query-images-thumbnails">
                                                {occurrenceImgs.map((img, idx) => (
                                                    <div 
                                                        key={`query-${idx}`} 
                                                        className={`match-query-image-item ${selectedImageIndex === idx ? "active" : ""}`}
                                                        onClick={() => setSelectedImageIndex(idx)}
                                                    >
                                                        <img 
                                                            src={img.url} 
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
                                        <h5>MIEWID Matched Shark: {(() => {
                                            const sharkOccurrences = visionOccurrences.filter(occ => occ.id === selectedSharkId);
                                            const occurrence = sharkOccurrences[selectedImageIndex];
                                            return occurrence?.matched_shark_id || 'N/A';
                                        })()}</h5>
                                        <div className="match-match-info">
                                            {(() => {
                                                const sharkOccurrences = visionOccurrences.filter(occ => occ.id === selectedSharkId);
                                                const occurrence = sharkOccurrences[selectedImageIndex];
                                                return (
                                                    <>
                                                        <p className="match-distance">
                                                            <strong>Distance:</strong> 
                                                            <span className={`match-distance-value ${occurrence?.miewid_match_distance < 1.0 ? "good" : "moderate"}`}>
                                                                {occurrence?.miewid_match_distance || 'N/A'}
                                                            </span>
                                                        </p>
                                                        {occurrence?.plausibility && (
                                                            <p className="match-plausibility-display">
                                                                <strong>Plausibility:</strong> 
                                                                <span className={`match-plausibility plausibility-${occurrence.plausibility.toLowerCase()}`}>
                                                                    {occurrence.plausibility}
                                                                </span>
                                                            </p>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                            <div className="match-distance-legend">
                                                <small>
                                                    Distance Scale: 0.0 = Perfect match | 0.5-1.0 = Very similar | 1.0-2.0 = Moderate | 2.0+ = Different
                                                </small>
                                            </div>
                                        </div>
                                        {(() => {
                                            const sharkOccurrences = visionOccurrences.filter(occ => occ.id === selectedSharkId);
                                            const occurrence = sharkOccurrences[selectedImageIndex];
                                            
                                            if (!occurrence?.matched_shark_id) {
                                                return <p className="match-no-matches">No match data available</p>;
                                            }
                                            
                                            const matchedImages = getSharkImages(occurrence.matched_shark_id);
                                            
                                            if (matchedImages.length === 0) {
                                                return <p className="match-no-matches">No images found for matched shark ID</p>;
                                            }
                                            
                                            return (
                                                <>
                                                    {/* Main matched image */}
                                                    <img 
                                                        src={selectedMatchedImage?.url || matchedImages[0].url} 
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
                                                    {matchedImages.length > 1 && (
                                                        <div className="match-query-images-grid">
                                                            <h6>All Matched Images ({matchedImages.length}):</h6>
                                                            <div className="match-query-images-thumbnails">
                                                                {matchedImages.map((img, idx) => (
                                                                    <div 
                                                                        key={`matched-${idx}`} 
                                                                        className={`match-query-image-item ${selectedMatchedImage?.url === img.url ? "active" : idx === 0 ? "active" : ""}`}
                                                                        onClick={() => setSelectedMatchedImage(img)}
                                                                    >
                                                                        <img 
                                                                            src={img.url} 
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

