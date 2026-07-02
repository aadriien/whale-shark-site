/* Graph types */

/* ---- Filters ---- */

// The 5 filter dimensions common to both graphs
export type SharedFilterKey =
    | "mutual_only"
    | "continents"
    | "no_contradictions"
    | "contradictions_only"
    | "hide_edges";

export type NodeFilter = "all" | "gbif" | "ningaloo";

// Population pairing is a single-select axis; "mutual only" is an independent
// toggle that ANDs with it (combining "cross" + mutual is impossible. Ningaloo
// nodes have no outgoing matches, so a gbif_to_ningaloo edge can never be mutual)
export type EdgePopulationFilter = "all" | "cross" | "same";

export type EdgeFilterState = {
    population: EdgePopulationFilter;
    mutualOnly: boolean;
    hideEdges: boolean;
    distanceRange: [number, number];
};

// The 9 togglable filter dimensions for the match graph (the 5 shared ones
// plus 4 population-specific ones), used by FILTER_CONSTRAINTS in GraphUtils
// to resolve cross-filter dependencies (e.g. "mutual matches only" implies
// "GBIF only" nodes with "GBIF x GBIF" edge connections)
export type FilterKey =
    | SharedFilterKey
    | "gbif_only"
    | "ningaloo_only"
    | "gbif_gbif"
    | "gbif_ningaloo";

// Ranking graph has no population axis, so baseline filter set
export type SharkRankingFilterKey = SharedFilterKey;

export type ContinentFilter =
    | "all"
    | "North America"
    | "Asia"
    | "Oceania"
    | "Africa"
    | "South America"
    | "Europe";

/* ---- Theme ---- */

export type GraphThemeColors = {
    contradiction: string;
    highlightBorder: string;
    sameSharkBorder: string;
    ningaloo: string;
    gbifToNingaloo: string;
    gbifToGbif: string;
    nodeBorder: string;
    nodeBorderOpacity: number;
    ningalooBorder: string;
    ningalooBorderOpacity: number;
    dimOpacity: number;
    continents: Record<string, string>;
};

/* ---- View params (Cytoscape view-application config) ---- */

type BaseViewParams = {
    continentFilters: Set<string>;
    focusedNodeId: string | null;
    noContradictions: boolean;
    contradictionsOnly: boolean;
    showContradictionPath: boolean;
    colors: GraphThemeColors;
};

export type GraphViewParams = BaseViewParams & {
    nodeFilter: NodeFilter;
    edgeFilter: EdgeFilterState;
};

export type SharkRankingViewParams = BaseViewParams & {
    edgeFilter: {
        mutualOnly: boolean;
        hideEdges: boolean;
        distanceRange: [number, number];
    };
};

/* ---- Contradiction clusters ---- */

// Per cluster_id, the shark_id pairs flagged as mutually exclusive. Same
// shape for both graphs' contradiction-detection output.
export type ContradictionEntry = {
    cluster_id: number;
    conflicting_shark_ids: string[][];
};

/* ---- Match graph (image-level) data shapes ---- */

export type GraphNode = {
    id: string;
    population: string;
    shark_id: string;
    image_id: number;
    x: number;
    y: number;
    cluster_id_mutual: number | null;
    cluster_id_all: number | null;
    contradiction_mutual: boolean;
    contradiction_all: boolean;
};

export type GraphEdge = {
    source: string;
    target: string;
    distance: number;
    edge_type: string;
    mutual: boolean;
};

export type GraphData = {
    nodes: GraphNode[];
    edges: GraphEdge[];
    contradictions_mutual: ContradictionEntry[];
    contradictions_all: ContradictionEntry[];
};

/* ---- Ranking graph (shark-level) data shapes ---- */

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

export type SharkRankingGraphData = {
    nodes: SharkRankingNode[];
    edges: SharkRankingEdge[];
    contradictions: ContradictionEntry[];
};

/* ---- Selected match (click results in side panels) ---- */

type BaseSelectedMatch = {
    clickedSharkId: string;
    matchSharkId: string;
    conflictingSharkIds: string[];
};

export type SelectedMatch = BaseSelectedMatch & {
    clickedImageId: number;
    matchPopulation: "gbif" | "ningaloo";
    matchDistance: number;
    contradictionImageIds: number[];
};

export type SelectedSharkMatch = BaseSelectedMatch & {
    distanceMedian: number;
    distanceMin: number;
    distanceMean: number;
    distanceMax: number;
    pairCount: number;
    isMutual: boolean;
};

/* ---- Panel props ---- */

type BaseNodePanelProps<M> = {
    match: M | null;
    onClose: () => void;
    showContradictionPath: boolean;
    onToggleContradictionPath: () => void;
};

export type GraphNodePanelProps = BaseNodePanelProps<SelectedMatch>;
export type SharkRankingNodePanelProps = BaseNodePanelProps<SelectedSharkMatch>;

type BaseDetailPanelProps<M> = {
    match: M | null;
    onClose: () => void;
};

export type GraphImagesPanelProps = BaseDetailPanelProps<SelectedMatch> & {
    onSelectImage: (imageId: number) => void;
};

export type SharkRankingStatsPanelProps = BaseDetailPanelProps<SelectedSharkMatch>;