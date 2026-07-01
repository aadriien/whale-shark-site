import { useMemo } from "react";

import GraphPanelShell from "../../panels/GraphPanelShell";
import { SharkRankingStatsPanelProps } from "../../../types/shark-ranking-graphs";

type PairwiseRow = {
    shark_id_a: string;
    image_url_a: string | null;
    shark_id_b: string;
    image_url_b: string | null;
    distance: number;
};

// Lazy-loaded pairwise data
let _pairwiseData: PairwiseRow[] | null = null;
let _pairwisePromise: Promise<PairwiseRow[]> | null = null;

function loadPairwiseData(): Promise<PairwiseRow[]> {
    if (_pairwiseData) return Promise.resolve(_pairwiseData);
    if (_pairwisePromise) return _pairwisePromise;

    _pairwisePromise = import("../../../assets/data/json/shark-ranking/GBIF_shark_pairwise_distances.json")
        .then((mod) => {
            _pairwiseData = mod.default as PairwiseRow[];
            return _pairwiseData;
        });
    return _pairwisePromise;
}

function usePairwiseData(sharkIdA: string | null, sharkIdB: string | null): PairwiseRow[] {
    return useMemo(() => {
        if (!sharkIdA || !sharkIdB || !_pairwiseData) return [];

        return _pairwiseData.filter(
            (row) =>
                (row.shark_id_a === sharkIdA && row.shark_id_b === sharkIdB) ||
                (row.shark_id_a === sharkIdB && row.shark_id_b === sharkIdA)
        );
    }, [sharkIdA, sharkIdB]);
}

// Kick off load so data is ready by the time user clicks a node
loadPairwiseData();

function renderBody(
    match: NonNullable<SharkRankingStatsPanelProps["match"]>,
    pairRows: PairwiseRow[]
) {
    const sortedPairs = [...pairRows].sort((a, b) => a.distance - b.distance);

    return (
        <>
            <div className="graph-panel-section">
                <span className="graph-panel-label">Aggregate Distance Stats</span>
                <div className="shark-ranking-stats-grid">
                    <div className="shark-ranking-stat">
                        <span className="shark-ranking-stat-label">Min</span>
                        <span className="shark-ranking-stat-value">{match.distanceMin.toFixed(4)}</span>
                    </div>
                    <div className="shark-ranking-stat">
                        <span className="shark-ranking-stat-label">Median</span>
                        <span className="shark-ranking-stat-value">{match.distanceMedian.toFixed(4)}</span>
                    </div>
                    <div className="shark-ranking-stat">
                        <span className="shark-ranking-stat-label">Mean</span>
                        <span className="shark-ranking-stat-value">{match.distanceMean.toFixed(4)}</span>
                    </div>
                    <div className="shark-ranking-stat">
                        <span className="shark-ranking-stat-label">Max</span>
                        <span className="shark-ranking-stat-value">{match.distanceMax.toFixed(4)}</span>
                    </div>
                </div>
                <p className="shark-ranking-pair-count">
                    {match.pairCount} image pair{match.pairCount !== 1 ? "s" : ""} compared
                </p>
            </div>

            {sortedPairs.length > 0 && (
                <>
                    <div className="graph-panel-divider" />
                    <div className="graph-panel-section">
                        <span className="graph-panel-label">Per-Image Pair Distances</span>
                        {sortedPairs.map((row, i) => (
                            <div key={i} className="graph-panel-image-row">
                                {row.image_url_a ? (
                                    <img
                                        src={row.image_url_a}
                                        alt={`Shark ${row.shark_id_a}`}
                                        className="graph-panel-thumbnail"
                                    />
                                ) : (
                                    <div className="graph-panel-thumbnail graph-panel-thumbnail--missing" />
                                )}
                                <span className="graph-panel-row-arrow">↔</span>
                                {row.image_url_b ? (
                                    <img
                                        src={row.image_url_b}
                                        alt={`Shark ${row.shark_id_b}`}
                                        className="graph-panel-thumbnail"
                                    />
                                ) : (
                                    <div className="graph-panel-thumbnail graph-panel-thumbnail--missing" />
                                )}
                                <span className="shark-ranking-pair-dist">
                                    {row.distance.toFixed(4)}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </>
    );
}

function SharkRankingStatsPanel({ match, onClose }: SharkRankingStatsPanelProps) {
    const pairRows = usePairwiseData(
        match?.clickedSharkId ?? null,
        match?.matchSharkId ?? null
    );

    return (
        <GraphPanelShell isEmpty={!match} emptyAlt="Click a node to see match statistics" onClose={onClose}>
            {match && renderBody(match, pairRows)}
        </GraphPanelShell>
    );
}

export default SharkRankingStatsPanel;
