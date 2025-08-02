import { useState, useRef } from "react";

import Globe from "../components/Globe.jsx";
import SharkGrid from "../components/SharkGrid.jsx";

import { storySharks } from "../utils/DataUtils.js";

function SharkTracker() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [playingSharkId, setPlayingSharkId] = useState(null);
    const [currentPoint, setCurrentPoint] = useState(null);

    const globeRef = useRef();

    const sharks = storySharks;

    const mid = Math.ceil(sharks.length / 2);
    const leftSharks = sharks.slice(0, mid);
    const rightSharks = sharks.slice(mid);

    const handlePlayStory = (sharkId) => {
        setIsPlaying(true);
        setPlayingSharkId(sharkId);

        // Reset isPlaying state when story finished
        // (buttons disabled while story playing)
        globeRef.current?.playStory(sharkId, (point) => {
            setCurrentPoint(point);
        }).finally(() => {
            // Clear after story ends
            setIsPlaying(false);  
            setPlayingSharkId(null);
            setCurrentPoint(null); 
        });
    };

    return (
        <div className="page-content sharktracker-wrapper">
            {/* <h1>SharkTracker Page</h1> */}

            <div className="globe-cards-container">
                {/* Left Shark Cards */}
                <div className="side-column">
                    <SharkGrid sharks={leftSharks} onPlayStory={handlePlayStory} isPlaying={isPlaying} playingSharkId={playingSharkId} />
                </div>

                {/* Globe */}
                <div className="globe-container" style={{ position: "relative" }}>
                    <Globe ref={globeRef} />
                    <div 
                        style={{
                            position: "absolute",
                            bottom: 10,
                            width: "100%",
                            textAlign: "center",
                            color: "white",
                            fontSize: "0.85rem",
                            fontFamily: "sans-serif",
                            padding: "2px 0",

                            // Fully transparent (no strip blocking globe, but can maybe add shadow later)
                            backgroundColor: "rgba(0, 0, 0, 0)", 

                            // Ensure clicks pass through to globe canvas
                            pointerEvents: "none",  
                            userSelect: "none",
                        }}
                    >
                        {
                            currentPoint 
                            ? `
                                Lat: ${currentPoint.lat.toFixed(3)}, 
                                Lng: ${currentPoint.lng.toFixed(3)} — 
                                Date: ${currentPoint.date || "N/A"}
                              `
                            : "Story playback info will appear here"
                        }
                    </div>
                </div>

                {/* Right Shark Cards */}
                <div className="side-column">
                    <SharkGrid sharks={rightSharks} onPlayStory={handlePlayStory} isPlaying={isPlaying} playingSharkId={playingSharkId} />
                </div>
            </div>
        </div>
    );
}

export default SharkTracker;


