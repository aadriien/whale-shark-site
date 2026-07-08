import { GlobeCoordinateReadoutProps } from "../../types/globes";

const GlobeCoordinateReadout = ({ point, placeholder }: GlobeCoordinateReadoutProps) => {
    if (!point && !placeholder) return null;

    return (
        <div className="globe-coordinate-readout">
            {point ? (
                <>
                    Lat: <span className="globe-coordinate-value">{point.lat.toFixed(3)}</span>,
                    Lng: <span className="globe-coordinate-value">{point.lng.toFixed(3)}</span> —
                    Date: <span className="globe-coordinate-value">{point.date || "N/A"}</span>
                </>
            ) : (
                placeholder
            )}
        </div>
    );
};

export default GlobeCoordinateReadout;
