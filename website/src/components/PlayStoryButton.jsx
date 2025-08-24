const PlayStoryButton = ({ shark, onPlayStory, isPlaying, playingSharkId }) => {
    if (!shark) return null;

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

