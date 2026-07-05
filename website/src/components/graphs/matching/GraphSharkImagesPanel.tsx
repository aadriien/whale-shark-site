import type { Core } from "cytoscape";

import { visionOccurrences } from "../../../utils/DataUtils";
import { findBestMatch } from "../../../utils/GraphUtils";
import GraphPanelShell from "../../panels/GraphPanelShell";
import { GraphImagesPanelProps } from "../../../types/panels";

const imageIdToUrl = new Map<number, string>(
    visionOccurrences
        .filter((occ) => occ.image_id != null && occ.identifier_url)
        .map((occ) => [occ.image_id as number, occ.identifier_url as string])
);

function GraphSharkImagesPanel({ match, cy, onSelectImage }: GraphImagesPanelProps) {
    return (
        <GraphPanelShell
            isEmpty={!match}
            emptyAlt="Click a GBIF node to see all images for that shark"
        >
            {match && cy && renderBody(cy, match, onSelectImage)}
        </GraphPanelShell>
    );
}

function renderBody(
    cy: Core,
    match: NonNullable<GraphImagesPanelProps["match"]>,
    onSelectImage: GraphImagesPanelProps["onSelectImage"]
) {
    const { clickedSharkId, clickedImageId, contradictionImageIds } = match;

    const sharkOccurrences = visionOccurrences.filter((occ) => occ.id === clickedSharkId);
    const occurrenceMatches = sharkOccurrences.map((occ) => ({
        occ,
        match: occ.image_id != null ? findBestMatch(cy, `gbif_${occ.image_id}`) : null,
    }));

    const voteTallyMap = new Map<string, number>();
    for (const { match: occMatch } of occurrenceMatches) {
        if (occMatch) {
            voteTallyMap.set(
                occMatch.matchSharkId,
                (voteTallyMap.get(occMatch.matchSharkId) ?? 0) + 1
            );
        }
    }
    const sortedVotes = [...voteTallyMap.entries()]
        .map(([sharkId, count]) => ({ sharkId, count }))
        .sort((a, b) => b.count - a.count);

    return (
        <>
            <div className="graph-panel-section">
                <span className="graph-panel-label">Other Images · Shark {clickedSharkId}</span>

                {occurrenceMatches.length === 0 ? (
                    <p className="graph-panel-missing">No occurrences found for this shark</p>
                ) : (
                    occurrenceMatches.map(({ occ, match: occMatch }) => {
                        const matchedUrl =
                            occMatch?.matchImageId != null
                                ? imageIdToUrl.get(occMatch.matchImageId)
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
                                    {occMatch?.matchSharkId ?? "—"}
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
        </>
    );
}

export default GraphSharkImagesPanel;