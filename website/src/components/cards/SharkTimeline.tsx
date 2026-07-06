import { SharkTimelineProps } from "../../types/cards";

const SharkTimeline = ({ entries, sourceLabel }: SharkTimelineProps) => {
    return (
        <>
            {sourceLabel && (
                <li className="timeline-source-header">Record: {sourceLabel}</li>
            )}
            {entries.map((entry, index) => (
                <li key={index} className="timeline-item">
                    <div className="timeline-header">
                        <strong>{entry.header}</strong>{" "}
                        <span className="timeline-date">({entry.date})</span>
                    </div>
                    <div className="timeline-region">
                        <span className="timeline-label">Region:</span> <em>{entry.region}</em>
                    </div>
                    <div className="timeline-meta">
                        <span className="timeline-label">Published by:</span>{" "}
                        <em>{entry.publishing}</em>
                    </div>
                    <div className="timeline-remarks">
                        <span className="timeline-label">Sighting remarks:</span>{" "}
                        <em>{entry.remarks}</em>
                    </div>
                </li>
            ))}
        </>
    );
};

export default SharkTimeline;
