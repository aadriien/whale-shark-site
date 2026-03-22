import { useState, useRef } from "react";

import Globe from "../components/Globe";
import SharkGrid from "../components/cards/SharkGrid";

import { storySharks } from "../utils/DataUtils";

import { PlottedCoordinatePoint } from "../types/coordinates";
import { GlobeHandle } from "../types/globes";


function SharkTracker() {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [playingSharkId, setPlayingSharkId] = useState<string>(null);
    const [currentPoint, setCurrentPoint] = useState<PlottedCoordinatePoint>(null);

    const globeHandleRef = useRef<GlobeHandle>(null);

    const sharks = storySharks;

    const mid = Math.ceil(sharks.length / 2);
    const leftSharks = sharks.slice(0, mid);
    const rightSharks = sharks.slice(mid);

    const handlePlayStory = (sharkId: string) => {
        setIsPlaying(true);
        setPlayingSharkId(sharkId);

        // Reset isPlaying state when story finished
        // (buttons disabled while story playing)
        globeHandleRef.current?.playStory(sharkId, (point) => {
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
                    <SharkGrid 
                        sharks={leftSharks} 
                        onPlayStory={handlePlayStory} 
                        isPlaying={isPlaying} 
                        playingSharkId={playingSharkId} 
                    />
                </div>

                {/* Globe */}
                <div className="globe-container" style={{ position: "relative" }}>
                    <Globe ref={globeHandleRef} />
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

                            // Fully transparent (no strip blocking globe), but soft highlight
                            backgroundColor: "rgba(0, 0, 0, 0)", 
                            textShadow: "0 0 8px rgba(0, 255, 255, 0.9)",

                            // Ensure clicks pass through to globe canvas
                            pointerEvents: "none",  
                            userSelect: "none",
                        }}
                    >
                        {currentPoint ? (
                            <>
                                Lat: <span style={{ fontWeight: "bold" }}>{currentPoint.lat.toFixed(3)}</span>,{" "}
                                Lng: <span style={{ fontWeight: "bold" }}>{currentPoint.lng.toFixed(3)}</span> —{" "}
                                Date: <span style={{ fontWeight: "bold" }}>{currentPoint.date || "N/A"}</span>
                            </>
                        ) : (
                            "Story playback info will appear here"
                        )}
                    </div>
                </div>

                {/* Right Shark Cards */}
                <div className="side-column">
                    <SharkGrid 
                        sharks={rightSharks} 
                        onPlayStory={handlePlayStory} 
                        isPlaying={isPlaying} 
                        playingSharkId={playingSharkId} 
                    />
                </div>
            </div>
        </div>
    );
}

export default SharkTracker;


