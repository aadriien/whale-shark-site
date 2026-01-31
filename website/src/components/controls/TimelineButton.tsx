import { TimelineButtonProps } from "types/controls";


const TimelineButton = ({ 
    onToggleTimelineMode, 
    isTimelineMode = false 
}: TimelineButtonProps) => {
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
                        Explore Shark Data <strong>Timeline</strong>
                    </>
                )}
            </button>
        </div>
    );
};

export default TimelineButton;

