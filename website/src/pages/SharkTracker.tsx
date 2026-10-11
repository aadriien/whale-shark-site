import { useState, useRef } from "react";

import Globe from "../components/Globe";
import GlobePageLayout from "../components/GlobePageLayout";
import SharkGrid from "../components/cards/SharkGrid";
import GlobeCoordinateReadout from "../components/controls/GlobeCoordinateReadout";

import { storySharks } from "../utils/DataUtils";

import { PlottedCoordinatePoint } from "../types/coordinates";
import { GlobeHandle } from "../types/globes";

function SharkTracker() {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [playingSharkId, setPlayingSharkId] = useState<string | null>(null);
    const [currentPoint, setCurrentPoint] = useState<PlottedCoordinatePoint | null>(null);

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
        globeHandleRef.current
            ?.playStory(sharkId, (point) => {
                setCurrentPoint(point);
            })
            .finally(() => {
                // Clear after story ends
                setIsPlaying(false);
                setPlayingSharkId(null);
                setCurrentPoint(null);
            });
    };

    return (
        <div className="page-content sharktracker-wrapper">
            {/* <h1>SharkTracker Page</h1> */}

            <GlobePageLayout
                containerClassName="globe-cards-container"
                // Left Shark Cards
                left={{
                    label: "Sharks",
                    className: "side-column",
                    content: (
                        <SharkGrid
                            sharks={leftSharks}
                            onPlayStory={handlePlayStory}
                            isPlaying={isPlaying}
                            playingSharkId={playingSharkId ?? ""}
                        />
                    ),
                }}
                // Right Shark Cards
                right={{
                    label: "Sharks",
                    className: "side-column",
                    content: (
                        <SharkGrid
                            sharks={rightSharks}
                            onPlayStory={handlePlayStory}
                            isPlaying={isPlaying}
                            playingSharkId={playingSharkId ?? ""}
                        />
                    ),
                }}
            >
                {/* Globe */}
                <Globe ref={globeHandleRef} />
                <GlobeCoordinateReadout
                    point={currentPoint}
                    placeholder="Story playback info will appear here"
                />
            </GlobePageLayout>
        </div>
    );
}

export default SharkTracker;
