/* Graph types */

export type NodeFilter = "all" | "gbif" | "ningaloo";

// Population pairing is a single-select axis; "mutual only" is an independent
// toggle that ANDs with it (combining "cross" + mutual is impossible. Ningaloo
// nodes have no outgoing matches, so a gbif_to_ningaloo edge can never be mutual)
export type EdgePopulationFilter = "all" | "cross" | "same";

export type EdgeFilterState = {
    population: EdgePopulationFilter;
    mutualOnly: boolean;
    hideEdges: boolean;
};

export type GraphViewParams = {
    nodeFilter: NodeFilter;
    edgeFilter: EdgeFilterState;
    continentFilters: Set<string>;
    focusedNodeId: string | null;
    noContradictions: boolean;
    contradictionsOnly: boolean;
    showContradictionPath: boolean;
};

// The 8 togglable filter dimensions, used by FILTER_CONSTRAINTS in GraphUtils
// to resolve cross-filter dependencies (e.g. "mutual matches only" implies
// "GBIF only" nodes with "GBIF x GBIF" edge connections)
export type FilterKey =
    | "gbif_only"
    | "ningaloo_only"
    | "gbif_gbif"
    | "gbif_ningaloo"
    | "mutual_only"
    | "continents"
    | "no_contradictions"
    | "contradictions_only"
    | "hide_edges";

export type ContinentFilter =
    | "all"
    | "North America"
    | "Asia"
    | "Oceania"
    | "Africa"
    | "South America"
    | "Europe";

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

export type ContradictionEntry = {
    cluster_id: number;
    conflicting_shark_ids: string[][];
};

export type GraphData = {
    nodes: GraphNode[];
    edges: GraphEdge[];
    contradictions_mutual: ContradictionEntry[];
    contradictions_all: ContradictionEntry[];
};

export type SelectedMatch = {
    clickedSharkId: string;
    clickedImageId: number;
    matchSharkId: string;
    matchPopulation: "gbif" | "ningaloo";
    matchDistance: number;
    conflictingSharkIds: string[];
};

export type GraphNodePanelProps = {
    match: SelectedMatch | null;
    onClose: () => void;
    showContradictionPath: boolean;
    onToggleContradictionPath: () => void;
};

export type GraphImagesPanelProps = {
    match: SelectedMatch | null;
    onClose: () => void;
};
