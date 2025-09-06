const TimelineButton = ({ 
    onToggleTimelineMode, 
    isTimelineMode = false 
}) => {
    return (
        <div className="timeline-mode-section">
            <button
                className={`geo-labs-timeline-button
                    ${isTimelineMode ? " timeline-mode-active" : ""}
                `}
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleTimelineMode();
                }}
            >
                {isTimelineMode ? (
                    "Exit Timeline Mode"
                ) : (
                    <>
                        Filter by <strong>Timeline</strong>
                    </>
                )}
            </button>
        </div>
    );
};

export default TimelineButton;

