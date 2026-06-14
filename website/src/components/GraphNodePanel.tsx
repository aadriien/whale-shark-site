import sharkSelectionPlaceholder from "../assets/images/chart-placeholders/globe-views.svg";

import CondensedSharkCard from "./cards/CondensedSharkCard";
import { mediaSharks, visionOccurrences } from "../utils/DataUtils";

import { GraphNodePanelProps } from "../types/graphs";

function GraphNodePanel({
    match,
    onClose,
    showContradictionPath,
    onToggleContradictionPath,
}: GraphNodePanelProps) {
    if (!match) {
        return (
            <div className="graph-node-panel graph-node-panel--empty">
                <img
                    src={sharkSelectionPlaceholder}
                    alt="Click a GBIF node to see its shark card"
                    className="graph-panel-placeholder"
                />
            </div>
        );
    }

    const clickedShark = mediaSharks.find((s) => s.id === match.clickedSharkId) ?? null;
    const matchedShark =
        match.matchPopulation === "gbif"
            ? (mediaSharks.find((s) => s.id === match.matchSharkId) ?? null)
            : null;

    const sharkOccurrences = visionOccurrences.filter((occ) => occ.id === match.clickedSharkId);
    const clickedOccurrence = sharkOccurrences.find((occ) => occ.image_id === match.clickedImageId);
    const imageURL = clickedOccurrence?.identifier_url;

    const image_ids = sharkOccurrences.map((s) => s.image_id);
    console.log(`valid shark image IDs include: ${image_ids.join(", ")}`);
    console.log(
        `clicked image ID ${match.clickedImageId} with URL ${imageURL} for shark ID ${clickedShark?.id}`
    );

    return (
        <div className="graph-node-panel">
            <button className="graph-panel-close" onClick={onClose} aria-label="Close panel">
                ✕
            </button>

            <div className="graph-panel-section">
                <span className="graph-panel-label">Selected image</span>
                {clickedShark ? (
                    <CondensedSharkCard shark={clickedShark} imageUrl={imageURL} />
                ) : (
                    <p className="graph-panel-missing">No data for ID {match.clickedSharkId}</p>
                )}
            </div>

            <div className="graph-panel-divider" />

            <div className="graph-panel-section">
                <span className="graph-panel-label">
                    Closest match
                    <span className="graph-panel-distance">
                        {" "}
                        · dist {match.matchDistance.toFixed(4)}
                    </span>
                </span>
                {match.matchPopulation === "gbif" ? (
                    matchedShark ? (
                        <CondensedSharkCard shark={matchedShark} />
                    ) : (
                        <p className="graph-panel-missing">No data for ID {match.matchSharkId}</p>
                    )
                ) : (
                    <div className="graph-panel-ningaloo">
                        <p className="graph-panel-ningaloo-label">Ningaloo reference</p>
                        <p className="graph-panel-ningaloo-id">{match.matchSharkId}</p>
                    </div>
                )}
            </div>

            {match.conflictingSharkIds.length > 0 && (
                <>
                    <div className="graph-panel-divider" />
                    <div className="graph-panel-section graph-panel-contradiction">
                        <span className="graph-panel-label">Contradiction</span>
                        <p>
                            A chain of matches links this image to whaleSharkID
                            {match.conflictingSharkIds.length > 1 ? "s" : ""}{" "}
                            {match.conflictingSharkIds.join(", ")}, but geo/temporal data says
                            that's IMPOSSIBLE for the same individual. The node with a solid red
                            border is the specific image that conflicts with this one.
                        </p>
                        <button
                            className={`graph-filter-btn${showContradictionPath ? " active" : ""}`}
                            onClick={onToggleContradictionPath}
                        >
                            {showContradictionPath ? "Hide" : "Show"} chain to conflicting image
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default GraphNodePanel;
