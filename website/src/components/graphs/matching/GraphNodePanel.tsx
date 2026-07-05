import { useState } from "react";

import CondensedSharkCard from "../../cards/CondensedSharkCard";
import MatchButton from "../../controls/MatchButton";
import MatchedSharkPairLightbox from "../../cards/MatchedSharkPairLightbox";
import { mediaSharks, visionOccurrences } from "../../../utils/DataUtils";
import {
    getSharkOccurrenceImages,
    activeOccurrenceIndex,
} from "../../../utils/graph/lightboxImages";
import GraphPanelShell from "../../panels/GraphPanelShell";

import { SelectedMatch } from "../../../types/graphs";
import { GraphNodePanelProps } from "../../../types/panels";

function renderBody(
    match: SelectedMatch,
    showContradictionPath: boolean,
    onToggleContradictionPath: () => void,
    onOpenLightbox: () => void
) {
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
        <>
            <MatchButton querySharkId={match.clickedSharkId} matchedSharkId={match.matchSharkId} />

            <div className="graph-panel-section">
                <span className="graph-panel-label">Selected image</span>
                {clickedShark ? (
                    <CondensedSharkCard
                        shark={clickedShark}
                        imageUrl={imageURL}
                        onImageClick={onOpenLightbox}
                    />
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
                        <CondensedSharkCard shark={matchedShark} onImageClick={onOpenLightbox} />
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
                        {match.contradictionImageIds.includes(match.clickedImageId) ? (
                            <>
                                <p>
                                    A chain of matches links this image to whaleSharkID
                                    {match.conflictingSharkIds.length > 1 ? "s" : ""}{" "}
                                    {match.conflictingSharkIds.join(", ")}, but geo/temporal data
                                    says that's IMPOSSIBLE for the same individual. The node with a
                                    solid red border is the specific image that conflicts with this
                                    one.
                                </p>
                                <button
                                    className={`graph-filter-btn${showContradictionPath ? " active" : ""}`}
                                    onClick={onToggleContradictionPath}
                                >
                                    {showContradictionPath ? "Hide" : "Show"} chain to conflicting
                                    whale shark image
                                </button>
                            </>
                        ) : (
                            <p>
                                Another image of this shark has a chain of matches linking it to
                                whaleSharkID{match.conflictingSharkIds.length > 1 ? "s" : ""}{" "}
                                {match.conflictingSharkIds.join(", ")}, which geo/temporal data says
                                is IMPOSSIBLE for the same individual. It's outlined in red in the
                                images panel.
                            </p>
                        )}
                    </div>
                </>
            )}
        </>
    );
}

function GraphNodePanel({
    match,
    showContradictionPath,
    onToggleContradictionPath,
    onSelectImage,
}: GraphNodePanelProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const clickedShark = match
        ? (mediaSharks.find((s) => s.id === match.clickedSharkId) ?? null)
        : null;
    const matchedShark =
        match && match.matchPopulation === "gbif"
            ? (mediaSharks.find((s) => s.id === match.matchSharkId) ?? null)
            : null;

    const queryImages = match ? getSharkOccurrenceImages(match.clickedSharkId) : [];
    const matchImages =
        match && match.matchPopulation === "gbif"
            ? getSharkOccurrenceImages(match.matchSharkId)
            : [];

    return (
        <GraphPanelShell isEmpty={!match} emptyAlt="Click a GBIF node to see its shark card">
            {match &&
                renderBody(match, showContradictionPath, onToggleContradictionPath, () =>
                    setLightboxOpen(true)
                )}

            {match && (
                <MatchedSharkPairLightbox
                    isOpen={lightboxOpen}
                    onClose={() => setLightboxOpen(false)}
                    querySharkId={match.clickedSharkId}
                    matchSharkId={match.matchSharkId}
                    distanceLabel="Image Embedding Distance"
                    distanceValue={match.matchDistance}
                    left={{
                        sharkId: match.clickedSharkId,
                        label: "QUERY SHARK ID",
                        countries: clickedShark?.countries,
                        oldest: clickedShark?.oldest,
                        newest: clickedShark?.newest,
                        images: queryImages,
                        activeIndex: activeOccurrenceIndex(queryImages, match.clickedImageId),
                        onSelectThumbnail: (idx) => onSelectImage(queryImages[idx].imageId),
                    }}
                    right={
                        matchImages.length > 0
                            ? {
                                  sharkId: match.matchSharkId,
                                  label: "MATCHED SHARK ID",
                                  countries: matchedShark?.countries,
                                  oldest: matchedShark?.oldest,
                                  newest: matchedShark?.newest,
                                  images: matchImages,
                                  activeIndex: activeOccurrenceIndex(
                                      matchImages,
                                      match.matchImageId
                                  ),
                                  onSelectThumbnail: (idx) =>
                                      onSelectImage(matchImages[idx].imageId),
                              }
                            : null
                    }
                />
            )}
        </GraphPanelShell>
    );
}

export default GraphNodePanel;
