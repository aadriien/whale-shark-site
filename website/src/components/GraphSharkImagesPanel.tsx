import sharkSelectionPlaceholder from "../assets/images/chart-placeholders/globe-views.svg";

import { visionOccurrences } from "../utils/DataUtils";
import { GraphImagesPanelProps } from "../types/graphs";

const imageIdToUrl = new Map<number, string>(
    visionOccurrences
        .filter((occ) => occ.image_id != null && occ.identifier_url)
        .map((occ) => [occ.image_id as number, occ.identifier_url as string])
);

function GraphSharkImagesPanel({ match, onClose, onSelectImage }: GraphImagesPanelProps) {
    if (!match) {
        return (
            <div className="graph-node-panel graph-node-panel--empty">
                <img
                    src={sharkSelectionPlaceholder}
                    alt="Click a GBIF node to see all images for that shark"
                    className="graph-panel-placeholder"
                />
            </div>
        );
    }

    const { clickedSharkId, clickedImageId, contradictionImageIds } = match;

    const sharkOccurrences = visionOccurrences.filter((occ) => occ.id === clickedSharkId);

    const voteTallyMap = new Map<string, number>();
    for (const occ of sharkOccurrences) {
        if (occ.matched_shark_id) {
            voteTallyMap.set(
                occ.matched_shark_id,
                (voteTallyMap.get(occ.matched_shark_id) ?? 0) + 1
            );
        }
    }
    const sortedVotes = [...voteTallyMap.entries()]
        .map(([sharkId, count]) => ({ sharkId, count }))
        .sort((a, b) => b.count - a.count);

    return (
        <div className="graph-node-panel">
            <button className="graph-panel-close" onClick={onClose} aria-label="Close panel">
                ✕
            </button>

            <div className="graph-panel-section">
                <span className="graph-panel-label">Other Images · Shark {clickedSharkId}</span>

                {sharkOccurrences.length === 0 ? (
                    <p className="graph-panel-missing">No occurrences found for this shark</p>
                ) : (
                    sharkOccurrences.map((occ) => {
                        const matchedUrl =
                            occ.matched_image_id != null
                                ? imageIdToUrl.get(occ.matched_image_id as number)
                                : undefined;

                        return (
                            <div
                                key={occ.image_id}
                                className={`graph-panel-image-row${occ.image_id === clickedImageId ? " graph-panel-image-row--selected" : ""}${contradictionImageIds.includes(occ.image_id as number) ? " graph-panel-image-row--contradiction" : ""}`}
                                onClick={() => onSelectImage(occ.image_id as number)}
                            >
                                {occ.identifier_url ? (
                                    <img
                                        src={occ.identifier_url}
                                        alt={`Shark ${clickedSharkId} image ${occ.image_id}`}
                                        className="graph-panel-thumbnail"
                                    />
                                ) : (
                                    <div className="graph-panel-thumbnail graph-panel-thumbnail--missing" />
                                )}
                                <span className="graph-panel-row-arrow">→</span>
                                {matchedUrl ? (
                                    <img
                                        src={matchedUrl}
                                        alt={`Match for image ${occ.image_id}`}
                                        className="graph-panel-thumbnail"
                                    />
                                ) : (
                                    <div className="graph-panel-thumbnail graph-panel-thumbnail--missing" />
                                )}
                                <span className="graph-panel-match-id">
                                    {occ.matched_shark_id ?? "—"}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>

            {sortedVotes.length > 0 && (
                <>
                    <div className="graph-panel-divider" />
                    <div className="graph-panel-section">
                        <span className="graph-panel-label">Match Tally</span>
                        {sortedVotes.map(({ sharkId, count }) => (
                            <div key={sharkId} className="graph-panel-vote-row">
                                <span className="graph-panel-vote-id">{sharkId}</span>
                                <span className="graph-panel-vote-count">{count}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default GraphSharkImagesPanel;
