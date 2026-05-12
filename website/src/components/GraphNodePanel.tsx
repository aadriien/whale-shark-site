import sharkSelectionPlaceholder from "../assets/images/chart-placeholders/globe-views.svg";

import CondensedSharkCard from "./cards/CondensedSharkCard";
import { mediaSharks } from "../utils/DataUtils";


export type SelectedMatch = {
    clickedSharkId: string;
    matchSharkId: string;
    matchPopulation: "gbif" | "ningaloo";
    matchDistance: number;
};

type GraphNodePanelProps = {
    match: SelectedMatch | null;
    onClose: () => void;
};


function GraphNodePanel({ match, onClose }: GraphNodePanelProps) {
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

    return (
        <div className="graph-node-panel">
            <button className="graph-panel-close" onClick={onClose} aria-label="Close panel">
                ✕
            </button>

            <div className="graph-panel-section">
                <span className="graph-panel-label">Selected image</span>
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
                    <span className="graph-panel-distance"> · dist {match.matchDistance.toFixed(4)}</span>
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
        </div>
    );
}

export default GraphNodePanel;