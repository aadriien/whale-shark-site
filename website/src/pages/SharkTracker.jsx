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
        <div className="sharktracker-wrapper">
            <h1>SharkTracker Page</h1>

            <div className="globe-cards-container">
                {/* Left Shark Cards */}
                <div className="side-column">
                    <SharkGrid sharks={leftSharks} onPlayStory={handlePlayStory} isPlaying={isPlaying} playingSharkId={playingSharkId} />
                </div>

                {/* Globe */}
                <div className="globe-container">
                    <Globe ref={globeRef} />
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


