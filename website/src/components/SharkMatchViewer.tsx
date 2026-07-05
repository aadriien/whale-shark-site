import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { mediaSharks, visionSharks, visionOccurrences, parseImageField } from "../utils/DataUtils";

import MatchSharkBox from "./cards/MatchSharkBox";
import MatchSharkSelector from "./panels/MatchSharkSelector";

import { ImageMetadata, ImagesWithMetadata } from "types/sharks";

function SharkMatchViewer() {
    const [searchParams, setSearchParams] = useSearchParams();
    // Initialize selected shark from URL
    const [selectedSharkId, setSelectedSharkId] = useState<string | null>(() => {
        const sharkId = searchParams.get("selectedSharkId");
        if (sharkId) return sharkId;
        return null;
    });
    const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
    const [occurrenceImgs, setOccurrenceImgs] = useState<ImagesWithMetadata>([]);
    const [selectedMatchedImage, setSelectedMatchedImage] = useState<ImageMetadata | null>(null);

    // Get images for a shark from mediaSharks
    const getSharkImages = (sharkId: string) => {
        const shark = mediaSharks.find((s) => s.id === sharkId);
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
            const sharkOccurrences = visionOccurrences.filter((occ) => occ.id === selectedSharkId);
            const occurrence = sharkOccurrences[selectedImageIndex];

            if (occurrence?.matched_shark_id) {
                const matchedImages = getSharkImages(occurrence.matched_shark_id);
                setSelectedMatchedImage(matchedImages.length > 0 ? matchedImages[0] : null);
            }
        }
    }, [selectedSharkId, selectedImageIndex]);

    // Update query param in URL if shark selected
    useEffect(() => {
        setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            if (selectedSharkId) {
                params.set("selectedSharkId", selectedSharkId);
            } else {
                params.delete("selectedSharkId");
            }
            return params;
        });
    }, [selectedSharkId, setSearchParams]);

    const getSharkInfo = (id: string) => {
        return visionSharks.find((shark) => shark.id === id);
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
                        selectedSharkId={selectedSharkId ?? ""}
                    />
                </div>

                {/* Main Viewer */}
                <div className="match-viewer-main">
                    {selectedSharkId && occurrenceImgs.length > 0 ? (
                        <>
                            {/* Match Stats Banner */}
                            <div className="match-info-banner">
                                {(() => {
                                    const sharkOccurrences = visionOccurrences.filter(
                                        (occ) => occ.id === selectedSharkId
                                    );
                                    const occurrence = sharkOccurrences[selectedImageIndex];
                                    return (
                                        <div className="match-stats-group">
                                            <div className="match-stats-left">
                                                <span className="match-stat-pair">
                                                    <span
                                                        className={`match-distance-value ${occurrence?.miewid_match_distance != null && occurrence.miewid_match_distance < 1.0 ? "good" : "moderate"}`}
                                                    >
                                                        {occurrence?.miewid_match_distance || "N/A"}
                                                    </span>
                                                </span>
                                                {occurrence?.plausibility && (
                                                    <span className="match-stat-pair">
                                                        <span
                                                            className={`match-plausibility plausibility-${occurrence.plausibility.toLowerCase()}`}
                                                        >
                                                            {occurrence.plausibility}
                                                        </span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="match-distance-legend-inline">
                                                <small>
                                                    Distance Scale: 0.0 = Perfect match | 0.5-1.0 =
                                                    Very similar | 1.0-2.0 = Moderate | 2.0+ =
                                                    Different
                                                </small>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="match-details">
                                <div className="match-container">
                                    {/* Query Shark Box */}
                                    <MatchSharkBox
                                        label="QUERY SHARK ID"
                                        sharkId={sharkInfo?.id ?? ""}
                                        countries={sharkInfo?.countries}
                                        oldest={sharkInfo?.oldest}
                                        newest={sharkInfo?.newest}
                                        images={occurrenceImgs}
                                        activeIndex={selectedImageIndex}
                                        onSelectThumbnail={setSelectedImageIndex}
                                        imagesLabel="All Images for Query Shark"
                                    />

                                    {/* Matched Shark Box */}
                                    {(() => {
                                        const sharkOccurrences = visionOccurrences.filter(
                                            (occ) => occ.id === selectedSharkId
                                        );
                                        const occurrence = sharkOccurrences[selectedImageIndex];
                                        const matchedShark = visionSharks.find(
                                            (s) => s.id === occurrence?.matched_shark_id
                                        );

                                        if (!occurrence?.matched_shark_id) {
                                            return (
                                                <div className="match-shark-box">
                                                    <p className="match-no-matches">
                                                        No match data available
                                                    </p>
                                                </div>
                                            );
                                        }

                                        const matchedImages = getSharkImages(
                                            occurrence.matched_shark_id
                                        );

                                        if (matchedImages.length === 0) {
                                            return (
                                                <div className="match-shark-box">
                                                    <p className="match-no-matches">
                                                        No images found for matched shark ID
                                                    </p>
                                                </div>
                                            );
                                        }

                                        const matchedImageIndex = selectedMatchedImage
                                            ? Math.max(
                                                  matchedImages.findIndex(
                                                      (img) => img.url === selectedMatchedImage.url
                                                  ),
                                                  0
                                              )
                                            : 0;

                                        return (
                                            <MatchSharkBox
                                                label="MATCHED SHARK ID"
                                                sharkId={occurrence.matched_shark_id}
                                                countries={matchedShark?.countries}
                                                oldest={matchedShark?.oldest}
                                                newest={matchedShark?.newest}
                                                images={matchedImages}
                                                activeIndex={matchedImageIndex}
                                                onSelectThumbnail={(idx) =>
                                                    setSelectedMatchedImage(matchedImages[idx])
                                                }
                                                imagesLabel="All Images for Matched Shark"
                                                footer={
                                                    occurrence.matched_shark_id_ningaloo ? (
                                                        <div className="match-ningaloo-note">
                                                            <span className="match-ningaloo-label">
                                                                Closest Ningaloo Match:
                                                            </span>
                                                            <span className="match-ningaloo-id">
                                                                {
                                                                    occurrence.matched_shark_id_ningaloo
                                                                }
                                                            </span>
                                                            <span className="match-ningaloo-distance">
                                                                (distance:{" "}
                                                                {occurrence.miewid_match_distance_ningaloo ??
                                                                    "N/A"}
                                                                )
                                                            </span>
                                                        </div>
                                                    ) : undefined
                                                }
                                            />
                                        );
                                    })()}
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
