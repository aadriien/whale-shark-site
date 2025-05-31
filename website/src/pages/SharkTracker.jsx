import { useState, useRef } from "react";

import Globe from "../components/Globe.jsx";
import SharkGrid from "../components/SharkGrid.jsx";

import { storySharks } from "../utils/DataUtils.js";

function SharkTracker() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [playingSharkId, setPlayingSharkId] = useState(null);
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
        globeRef.current?.playStory(sharkId).finally(() => {
            setIsPlaying(false);  
            setPlayingSharkId(null);
        });
    };

    return (
        <div style={{ 
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            overflowY: "auto",
            textAlign: "center",
            paddingTop: "60px"
        }}>
            <h1>SharkTracker Page</h1>
            <p>Here's where we'll do whale shark storytelling.</p>

            <div className="globe-cards-container"
                style={{
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    width: "100%",
                }}
            >
                {/* Left Shark Cards */}
                <div style={{ flex: "0.1", height: "35rem" }}>
                    <SharkGrid sharks={leftSharks} onPlayStory={handlePlayStory} isPlaying={isPlaying} playingSharkId={playingSharkId} />
                </div>

                {/* Globe */}
                <div className="globe-container" style={{ flex: "0.8", height: "40rem" }}>
                    <Globe ref={globeRef} />
                </div>

                {/* Right Shark Cards */}
                <div style={{ flex: "0.1", height: "35rem" }}>
                    <SharkGrid sharks={rightSharks} onPlayStory={handlePlayStory} isPlaying={isPlaying} playingSharkId={playingSharkId} />
                </div>
            </div>

        </div>
    );
}

export default SharkTracker;

  

