import { useState, useMemo, useRef, useEffect } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import type { ElementDefinition, StylesheetStyle, Core, EventObject, EdgeSingular } from "cytoscape";

import GraphNodePanel from "./GraphNodePanel";
import type { SelectedMatch } from "./GraphNodePanel";


type NodeFilter = "all" | "gbif" | "ningaloo";
type EdgeFilter = "all" | "cross" | "same" | "mutual";

type GraphNode = {
    id: string;
    population: string;
    shark_id: string;
    x: number;
    y: number;
};

type GraphEdge = {
    source: string;
    target: string;
    distance: number;
    edge_type: string;
    mutual: boolean;
};

type GraphData = { nodes: GraphNode[]; edges: GraphEdge[] };


const POSITION_SCALE = 5000;
const EDGE_OPACITY_MIN = 0.15;

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

const STYLESHEET: StylesheetStyle[] = [
    {
        selector: "node",
        style: {
            width: 12,
            height: 12,
            "border-width": 1,
            "border-color": "#000",
            "border-opacity": 1,
            label: "",
        },
    },
    {
        selector: "node[population = 'ningaloo']",
        style: { "background-color": "#4682b4" },
    },
    {
        selector: "node[population = 'gbif']",
        style: { "background-color": "#e8735a" },
    },
    {
        selector: "edge",
        style: {
            width: 1,
            opacity: "data(opacity)" as unknown as number,
            "curve-style": "straight",
            "target-arrow-shape": "none",
        },
    },
    {
        selector: "edge[edge_type = 'gbif_to_ningaloo']",
        style: { "line-color": "#3cb371" },
    },
    {
        selector: "edge[edge_type = 'gbif_to_gbif']",
        style: { "line-color": "#e8a020" },
    },
    {
        selector: "edge[?mutual]",
        style: { width: 2.5 },
    },
    {
        selector: "node:active",
        style: { "overlay-opacity": 0 },
    },
];


function normalizePositions(nodes: GraphNode[]): Map<string, { x: number; y: number }> {
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    const posMap = new Map<string, { x: number; y: number }>();
    for (const node of nodes) {
        posMap.set(node.id, {
            x: ((node.x - xMin) / xRange) * POSITION_SCALE,
            y: ((node.y - yMin) / yRange) * POSITION_SCALE,
        });
    }
    return posMap;
}

function buildElements(
    nodes: GraphNode[],
    edges: GraphEdge[],
    posMap: Map<string, { x: number; y: number }>,
): ElementDefinition[] {
    const nodeEls: ElementDefinition[] = nodes.map((n) => ({
        data: { id: n.id, population: n.population, shark_id: n.shark_id },
        position: posMap.get(n.id) ?? { x: 0, y: 0 },
    }));

    const distances = edges.map((e) => e.distance);
    const dMin = Math.min(...distances);
    const dMax = Math.max(...distances);
    const dRange = dMax - dMin || 1;

    const edgeEls: ElementDefinition[] = edges.map((e) => ({
        data: {
            id: `${e.source}__${e.target}`,
            source: e.source,
            target: e.target,
            edge_type: e.edge_type,
            mutual: e.mutual,
            distance: e.distance,
            opacity: 1 - ((e.distance - dMin) / dRange) * (1 - EDGE_OPACITY_MIN),
        },
    }));

    return [...nodeEls, ...edgeEls];
}

function applyFilters(cy: Core, nodeFilter: NodeFilter, edgeFilter: EdgeFilter) {
    cy.batch(() => {
        // Reset everything
        cy.nodes().style("display", "element");
        cy.edges().style("display", "element");

        // Node filter: Cytoscape auto-hides edges attached to hidden nodes
        if (nodeFilter === "gbif") {
            cy.nodes("[population = 'ningaloo']").style("display", "none");
        } 
        else if (nodeFilter === "ningaloo") {
            cy.nodes("[population = 'gbif']").style("display", "none");
        }

        // Edge filter: applied on top of whatever nodes are visible
        if (edgeFilter === "cross") {
            cy.edges("[edge_type != 'gbif_to_ningaloo']").style("display", "none");
        } 
        else if (edgeFilter === "same") {
            cy.edges("[edge_type != 'gbif_to_gbif']").style("display", "none");
        } 
        else if (edgeFilter === "mutual") {
            cy.edges("[?mutual != true]").style("display", "none");
        }
    });
}


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
                        stylesheet={STYLESHEET}
                        layout={{ name: "preset" }}
                        style={{ width: "100%", height: "100%", position: "absolute", top: "0", left: "0" }}
                        userZoomingEnabled={true}
                        userPanningEnabled={true}
                        autoungrabify={true}
                        boxSelectionEnabled={false}
                        textureOnViewport={true}
                        hideEdgesOnViewport={true}
                        pixelRatio={1}
                        minZoom={0.03}
                        maxZoom={3}
                        cy={(cy) => {
                            cyRef.current = cy;
                            if (lastCyInstance.current !== cy) {
                                lastCyInstance.current = cy;
                                cy.on("tap", (evt: EventObject) => {
                                    const target = evt.target as any;
                                    if (target === cy) {
                                        setSelectedMatch(null);
                                        return;
                                    }
                                    if (typeof target.isNode !== "function" || !target.isNode()) return;
                                    if (target.data("population") !== "gbif") return;

                                    const nodeId = target.id() as string;
                                    const clickedSharkId = target.data("shark_id") as string;

                                    let bestEdge: EdgeSingular | null = null;
                                    let bestDist = Infinity;
                                    cy.edges(`[source = "${nodeId}"]`).forEach((edge: EdgeSingular) => {
                                        const d = edge.data("distance") as number;
                                        if (d < bestDist) {
                                            bestDist = d;
                                            bestEdge = edge;
                                        }
                                    });

                                    if (!bestEdge) return;
                                    const targetNode = cy.getElementById((bestEdge as EdgeSingular).data("target") as string);
                                    setSelectedMatch({
                                        clickedSharkId,
                                        matchSharkId: targetNode.data("shark_id") as string,
                                        matchPopulation: targetNode.data("population") as "gbif" | "ningaloo",
                                        matchDistance: bestDist,
                                    });
                                });
                            }
                            cy.one("render", () => {
                                cy.resize();
                                cy.fit();
                                applyFilters(cy, nodeFilter, edgeFilter);
                            });
                        }}
                    />}
                </div>
            {selectedMatch && (
                <GraphNodePanel
                    match={selectedMatch}
                    onClose={() => setSelectedMatch(null)}
                />
            )}
            </div>
        </div>
    );
}

export default SharkMatchGraph;

