import sharkSelectionPlaceholder from "../../assets/images/chart-placeholders/globe-views.svg";

import CondensedSharkCard from "../cards/CondensedSharkCard";
import { mediaSharks } from "../../utils/DataUtils";

import { SharkRankingNodePanelProps } from "../../types/shark-ranking-graphs";

function SharkRankingNodePanel({
    match,
    onClose,
    showContradictionPath,
    onToggleContradictionPath,
}: SharkRankingNodePanelProps) {
    if (!match) {
        return (
            <div className="graph-node-panel graph-node-panel--empty">
                <img
                    src={sharkSelectionPlaceholder}
                    alt="Click a node to see its shark card"
                    className="graph-panel-placeholder"
                />
            </div>
        );
    }

    const clickedShark = mediaSharks.find((s) => s.id === match.clickedSharkId) ?? null;
    const matchedShark = mediaSharks.find((s) => s.id === match.matchSharkId) ?? null;

    return (
        <div className="graph-node-panel">
            <button className="graph-panel-close" onClick={onClose} aria-label="Close panel">
                ✕
            </button>

            <div className="graph-panel-section">
                <span className="graph-panel-label">Selected shark</span>
                {clickedShark ? (
                    <CondensedSharkCard shark={clickedShark} />
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
                        · median {match.distanceMedian.toFixed(4)}
                    </span>
                    {match.isMutual && (
                        <span className="graph-panel-mutual"> · mutual</span>
                    )}
                </span>
                {matchedShark ? (
                    <CondensedSharkCard shark={matchedShark} />
                ) : (
                    <p className="graph-panel-missing">No data for ID {match.matchSharkId}</p>
                )}
            </div>

            {match.conflictingSharkIds.length > 0 && (
                <>
                    <div className="graph-panel-divider" />
                    <div className="graph-panel-section graph-panel-contradiction">
                        <span className="graph-panel-label">Contradiction</span>
                        <p>
                            A chain of best-match edges links this shark to whaleSharkID
                            {match.conflictingSharkIds.length > 1 ? "s" : ""}{" "}
                            {match.conflictingSharkIds.join(", ")}, but geo/temporal data
                            says that's IMPOSSIBLE for the same individual.
                        </p>
                        <button
                            className={`graph-filter-btn${showContradictionPath ? " active" : ""}`}
                            onClick={onToggleContradictionPath}
                        >
                            {showContradictionPath ? "Hide" : "Show"} chain to conflicting
                            shark
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default SharkRankingNodePanel;
