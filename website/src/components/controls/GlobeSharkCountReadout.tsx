import { GlobeSharkCountReadoutProps } from "../../types/globes";

const GlobeSharkCountReadout = ({ shown, total }: GlobeSharkCountReadoutProps) => {
    return (
        <div className="globe-coordinate-readout">
            Showing{" "}
            {shown === total ? (
                <span className="globe-coordinate-value">all</span>
            ) : (
                <>
                    <span className="globe-coordinate-value">{shown}</span> of{" "}
                    <span className="globe-coordinate-value">{total}</span>
                </>
            )}{" "}
            whale sharks
        </div>
    );
};

export default GlobeSharkCountReadout;
