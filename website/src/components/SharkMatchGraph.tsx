import { useState, useMemo, useRef, useEffect } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import type { Core } from "cytoscape";

import GraphNodePanel from "./GraphNodePanel";
import { 
    GRAPH_STYLESHEET, 
    normalizePositions, 
    buildElements, 
    applyFilters, 
    initCyListeners 
} from "../utils/GraphUtils";

import { 
    NodeFilter, EdgeFilter, 
    GraphData, 
    SelectedMatch 
} from "../types/graphs";


const NODE_FILTER_LABELS: Record<NodeFilter, string> = {
    all: "All nodes",
    gbif: "GBIF only",
    ningaloo: "Ningaloo only",
};

const EDGE_FILTER_LABELS: Record<EdgeFilter, string> = {
    all: "All matches",
    cross: "GBIF x Ningaloo",
    same: "GBIF x GBIF",
    mutual: "Mutual matches only",
};


function SharkMatchGraph() {
    const [nodeFilter, setNodeFilter] = useState<NodeFilter>("all");
    const [edgeFilter, setEdgeFilter] = useState<EdgeFilter>("all");
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    
    const [selectedMatch, setSelectedMatch] = useState<SelectedMatch | null>(null);

    const cyRef = useRef<Core | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastCyInstance = useRef<Core | null>(null);

    useEffect(() => {
        import("../assets/data/json/graph_data.json").then((mod) => {
            setGraphData(mod.default as GraphData);
        });
    }, []);

    const nodes = graphData?.nodes ?? [];
    const edges = graphData?.edges ?? [];

    const posMap = useMemo(() => normalizePositions(nodes), [nodes]);
    const elements = useMemo(
        () => buildElements(nodes, edges, posMap),
        [nodes, edges, posMap],
    );

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new ResizeObserver(() => {
            cyRef.current?.resize();
            cyRef.current?.fit();
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (cyRef.current) applyFilters(cyRef.current, nodeFilter, edgeFilter);
    }, [nodeFilter, edgeFilter]);

    return (
        <div className="shark-match-graph-section">
            <div className="graph-header">
                <h2>Identity Match Graph</h2>
                <p>
                    Each node is a whale shark image. Edges connect GBIF images to their
                    nearest embedding (vector) match. Green crosses into the Ningaloo reference
                    database, orange stays within GBIF. Nearby nodes are visually similar images.
                </p>
                <div className="graph-legend">
                    <span className="legend-dot ningaloo" />
                    <span className="legend-label">Ningaloo (reference)</span>
                    <span className="legend-dot gbif" />
                    <span className="legend-label">GBIF (query)</span>
                    <span className="legend-line cross" />
                    <span className="legend-label">GBIF x Ningaloo</span>
                    <span className="legend-line within" />
                    <span className="legend-label">GBIF x GBIF</span>
                </div>
            </div>

            <div className="graph-controls">
                <div className="filter-group">
                    {(Object.keys(NODE_FILTER_LABELS) as NodeFilter[]).map((f) => (
                        <button
                            key={f}
                            className={`graph-filter-btn${nodeFilter === f ? " active" : ""}`}
                            onClick={() => setNodeFilter(f)}
                        >
                            {NODE_FILTER_LABELS[f]}
                        </button>
                    ))}
                </div>
                <div className="filter-group">
                    {(Object.keys(EDGE_FILTER_LABELS) as EdgeFilter[]).map((f) => (
                        <button
                            key={f}
                            className={`graph-filter-btn${edgeFilter === f ? " active" : ""}`}
                            onClick={() => setEdgeFilter(f)}
                        >
                            {EDGE_FILTER_LABELS[f]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="graph-canvas-row">
                <div ref={containerRef} className="cytoscape-canvas">
                    {!graphData ? (
                        <div className="graph-loading">Loading graph…</div>
                    ) : <CytoscapeComponent
                        elements={elements}
                        stylesheet={GRAPH_STYLESHEET}
                        layout={{ name: "preset" }}
                        style={{ 
                            width: "100%", 
                            height: "100%", 
                            position: "absolute", 
                            top: "0", 
                            left: "0" 
                        }}
                        userZoomingEnabled={true}
                        userPanningEnabled={true}
                        autoungrabify={true}
                        boxSelectionEnabled={false}
                        textureOnViewport={true}
                        hideEdgesOnViewport={true}
                        pixelRatio={1}
                        minZoom={0.03}
                        maxZoom={3}
                        cy={(cy: Core) => {
                            cyRef.current = cy;
                            if (lastCyInstance.current !== cy) {
                                lastCyInstance.current = cy;
                                initCyListeners(cy, nodeFilter, edgeFilter, setSelectedMatch);
                            }
                        }}
                    />}
                </div>
                <GraphNodePanel
                    match={selectedMatch}
                    onClose={() => setSelectedMatch(null)}
                />
            </div>
        </div>
    );
}

export default SharkMatchGraph;


