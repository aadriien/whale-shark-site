import CondensedSharkCard from "../../cards/CondensedSharkCard";
import { mediaSharks } from "../../../utils/DataUtils";
import GraphPanelShell from "../../panels/GraphPanelShell";

import { SharkRankingNodePanelProps, SelectedSharkMatch } from "../../../types/shark-ranking-graphs";

function renderBody(
    match: SelectedSharkMatch,
    showContradictionPath: boolean,
    onToggleContradictionPath: () => void
) {
    const clickedShark = mediaSharks.find((s) => s.id === match.clickedSharkId) ?? null;
    const matchedShark = mediaSharks.find((s) => s.id === match.matchSharkId) ?? null;

    return (
        <>
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
                    {match.isMutual && <span className="graph-panel-mutual"> · mutual</span>}
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
        </>
    );
}

function SharkRankingNodePanel({
    match,
    onClose,
    showContradictionPath,
    onToggleContradictionPath,
}: SharkRankingNodePanelProps) {
    return (
        <GraphPanelShell isEmpty={!match} emptyAlt="Click a node to see its shark card" onClose={onClose}>
            {match && renderBody(match, showContradictionPath, onToggleContradictionPath)}
        </GraphPanelShell>
    );
}

export default SharkRankingNodePanel;
