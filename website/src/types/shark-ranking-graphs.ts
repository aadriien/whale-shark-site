import { GraphThemeColors } from "./graphs";

export type SharkRankingNode = {
    id: string;
    shark_id: string;
    image_count: number;
    x: number;
    y: number;
    cluster_id: number | null;
    contradiction: boolean;
};

export type SharkRankingEdge = {
    source: string;
    target: string;
    distance_median: number;
    distance_min: number;
    distance_mean: number;
    distance_max: number;
    pair_count: number;
    mutual: boolean;
};

export type SharkRankingContradiction = {
    cluster_id: number;
    conflicting_shark_ids: string[][];
};

export type SharkRankingGraphData = {
    nodes: SharkRankingNode[];
    edges: SharkRankingEdge[];
    contradictions: SharkRankingContradiction[];
};

export type SharkRankingFilterKey =
    | "mutual_only"
    | "continents"
    | "no_contradictions"
    | "contradictions_only"
    | "hide_edges";

export type SharkRankingViewParams = {
    edgeFilter: {
        mutualOnly: boolean;
        hideEdges: boolean;
        distanceRange: [number, number];
    };
    continentFilters: Set<string>;
    focusedNodeId: string | null;
    noContradictions: boolean;
    contradictionsOnly: boolean;
    showContradictionPath: boolean;
    colors: GraphThemeColors;
};

export type SelectedSharkMatch = {
    clickedSharkId: string;
    matchSharkId: string;
    distanceMedian: number;
    distanceMin: number;
    distanceMean: number;
    distanceMax: number;
    pairCount: number;
    isMutual: boolean;
    conflictingSharkIds: string[];
};

export type SharkRankingNodePanelProps = {
    match: SelectedSharkMatch | null;
    onClose: () => void;
    showContradictionPath: boolean;
    onToggleContradictionPath: () => void;
};

export type SharkRankingStatsPanelProps = {
    match: SelectedSharkMatch | null;
    onClose: () => void;
};
