/* Graph types */

export type NodeFilter = "all" | "gbif" | "ningaloo";

export type EdgeFilter = "all" | "cross" | "same" | "mutual";


export type GraphNode = {
    id: string;
    population: string;
    shark_id: string;
    image_id: number;
    x: number;
    y: number;
};

export type GraphEdge = {
    source: string;
    target: string;
    distance: number;
    edge_type: string;
    mutual: boolean;
};

export type GraphData = { nodes: GraphNode[]; edges: GraphEdge[] };


export type SelectedMatch = {
    clickedSharkId: string;
    clickedImageId: number;
    matchSharkId: string;
    matchPopulation: "gbif" | "ningaloo";
    matchDistance: number;
};

export type GraphNodePanelProps = {
    match: SelectedMatch | null;
    onClose: () => void;
};


