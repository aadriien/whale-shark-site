import { useState, useEffect } from "react";

import CondensedSharkCard from "../../cards/CondensedSharkCard";
import MatchButton from "../../controls/MatchButton";
import MatchImageLightbox from "../shared/MatchImageLightbox";
import { mediaSharks, parseImageField } from "../../../utils/DataUtils";
import GraphPanelShell from "../../panels/GraphPanelShell";

import { SharkRankingNodePanelProps, SelectedSharkMatch } from "../../../types/graphs";

function renderBody(
    match: SelectedSharkMatch,
    showContradictionPath: boolean,
    onToggleContradictionPath: () => void,
    onOpenLightbox: () => void
) {
    const clickedShark = mediaSharks.find((s) => s.id === match.clickedSharkId) ?? null;
    const matchedShark = mediaSharks.find((s) => s.id === match.matchSharkId) ?? null;

    return (
        <>
            <MatchButton querySharkId={match.clickedSharkId} matchedSharkId={match.matchSharkId} />

            <div className="graph-panel-section">
                <span className="graph-panel-label">Selected shark</span>
                {clickedShark ? (
                    <CondensedSharkCard shark={clickedShark} onImageClick={onOpenLightbox} />
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
                    <CondensedSharkCard shark={matchedShark} onImageClick={onOpenLightbox} />
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
                            {match.conflictingSharkIds.join(", ")}, but geo/temporal data says
                            that's IMPOSSIBLE for the same individual.
                        </p>
                        <button
                            className={`graph-filter-btn${showContradictionPath ? " active" : ""}`}
                            onClick={onToggleContradictionPath}
                        >
                            {showContradictionPath ? "Hide" : "Show"} chain to conflicting shark
                        </button>
                    </div>
                </>
            )}
        </>
    );
}

function SharkRankingNodePanel({
    match,
    showContradictionPath,
    onToggleContradictionPath,
}: SharkRankingNodePanelProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [queryIdx, setQueryIdx] = useState(0);
    const [matchIdx, setMatchIdx] = useState(0);

    // A shark pair here is fixed, but reset which image is "main" on each
    // side whenever selected pair changes so stale indices don't linger
    useEffect(() => {
        setQueryIdx(0);
        setMatchIdx(0);
    }, [match?.clickedSharkId, match?.matchSharkId]);

    const clickedShark = match ? (mediaSharks.find((s) => s.id === match.clickedSharkId) ?? null) : null;
    const matchedShark = match ? (mediaSharks.find((s) => s.id === match.matchSharkId) ?? null) : null;

    const queryImages =
        clickedShark && clickedShark.image !== "Unknown" ? parseImageField(clickedShark.image) : [];
    const matchImages =
        matchedShark && matchedShark.image !== "Unknown" ? parseImageField(matchedShark.image) : [];

    return (
        <GraphPanelShell isEmpty={!match} emptyAlt="Click a node to see its shark card">
            {match &&
                renderBody(match, showContradictionPath, onToggleContradictionPath, () =>
                    setLightboxOpen(true)
                )}

            {match && (
                <MatchImageLightbox
                    isOpen={lightboxOpen}
                    onClose={() => setLightboxOpen(false)}
                    left={{
                        sharkId: match.clickedSharkId,
                        title: "QUERY SHARK ID",
                        images: queryImages,
                        activeIndex: queryIdx,
                        onSelectThumbnail: setQueryIdx,
                    }}
                    right={{
                        sharkId: match.matchSharkId,
                        title: "MATCHED SHARK ID",
                        images: matchImages,
                        activeIndex: matchIdx,
                        onSelectThumbnail: setMatchIdx,
                    }}
                />
            )}
        </GraphPanelShell>
    );
}

export default SharkRankingNodePanel;
