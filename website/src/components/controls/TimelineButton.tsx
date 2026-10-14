import { TimelineButtonProps } from "types/controls";

const TimelineButton = ({ onToggleTimelineMode, isTimelineMode = false }: TimelineButtonProps) => {
    return (
        <div className="timeline-mode-section">
            <button
                className="btn btn-secondary btn-block"
                aria-pressed={isTimelineMode}
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
