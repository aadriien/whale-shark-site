import { PlayStoryButtonProps } from "types/controls";


const PlayStoryButton = ({ 
    shark, 
    onPlayStory, isPlaying, playingSharkId, 
    showPauseForGeoLabs = false, 
    onToggleStepMode, isStepMode = false 
}: PlayStoryButtonProps) => {
    if (!shark) return null;

    // GeoLabs version with step-through functionality
    if (showPauseForGeoLabs) {
        return (
            <div className="play-story-section">
                <button
                    className={`geo-labs-step-button
                        ${isStepMode ? " step-mode-active" : ""}
                    `}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleStepMode();
                    }}
                >
                    {isStepMode ? (
                        "Exit Story Mode"
                    ) : (
                        <>
                            Step Through <strong>{shark.name || shark.id}</strong>'s Story
                        </>
                    )}
                </button>
            </div>
        );
    }

    // SharkTracker version with original play story functionality
    return (
        <div className="play-story-section">
            <button
                className={`play-story-button
                    ${playingSharkId === shark.id && isPlaying ? " currentlyPlaying" : ""}
                    ${isPlaying ? " anyPlaying" : ""}
                `}
                onClick={(e) => {
                    e.stopPropagation();
                    onPlayStory(shark.id);
                }}
                disabled={isPlaying}
            >
                {isPlaying ? (
                    "Story in Progress..."
                ) : (
                    <>
                        Play <strong>{shark.name || shark.id}</strong>'s Story
                    </>
                )}
            </button>
        </div>
    );
};

export default PlayStoryButton;

