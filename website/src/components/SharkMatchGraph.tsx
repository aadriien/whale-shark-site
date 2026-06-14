import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import type { Core } from "cytoscape";

import GraphNodePanel from "./GraphNodePanel";
import GraphSharkImagesPanel from "./GraphSharkImagesPanel";
import {
    GRAPH_STYLESHEET,
    CONTINENT_COLORS,
    normalizePositions,
    buildElements,
    applyGraphView,
    initCyListeners,
} from "../utils/GraphUtils";
import { mediaSharks, extractContinents } from "../utils/DataUtils";

import {
    NodeFilter,
    EdgePopulationFilter,
    GraphViewParams,
    GraphData,
    SelectedMatch,
} from "../types/graphs";

const NODE_FILTER_LABELS: Record<NodeFilter, string> = {
    all: "All nodes",
    gbif: "GBIF only",
    ningaloo: "Ningaloo only",
};

const EDGE_POPULATION_LABELS: Record<EdgePopulationFilter, string> = {
    all: "All matches",
    same: "GBIF x GBIF",
    cross: "GBIF x Ningaloo",
};

const CONTINENT_NAMES: string[] = [
    "North America",
    "Asia",
    "Oceania",
    "Africa",
    "South America",
    "Europe",
];

const CONTINENT_LABEL: Record<string, string> = {
    "North America": "North America",
    Asia: "Asia",
    Oceania: "Oceania",
    Africa: "Africa",
    "South America": "South America",
    Europe: "Europe",
};

const NINGALOO_COLOR = "#525252";

function SharkMatchGraph() {
    const [nodeFilter, setNodeFilter] = useState<NodeFilter>("all");
    const [edgePopulationFilter, setEdgePopulationFilter] = useState<EdgePopulationFilter>("same");

    const [mutualOnly, setMutualOnly] = useState(true);
    const [showEdges, setShowEdges] = useState(true);
    const [continentFilters, setContinentFilters] = useState<Set<string>>(new Set());

    const [contradictionsOnly, setContradictionsOnly] = useState(false);
    const [showContradictionPath, setShowContradictionPath] = useState(false);

    const [graphData, setGraphData] = useState<GraphData | null>(null);

    const [selectedMatch, setSelectedMatch] = useState<SelectedMatch | null>(null);
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

    // Filters cascade: a continent only describes GBIF sharks, so picking one
    // implies a GBIF-only node view; a GBIF-only view in turn only has
    // GBIF x GBIF matches to show. These "effective" values fold that logic in,
    // so the buttons always reflect what's actually applied to the graph.
    const effectiveNodeFilter: NodeFilter = continentFilters.size > 0 ? "gbif" : nodeFilter;
    const effectiveEdgePopulation: EdgePopulationFilter =
        effectiveNodeFilter === "gbif" ? "same" : edgePopulationFilter;
    const edgePopulationLocked = effectiveNodeFilter !== "all";
    const mutualLocked = effectiveEdgePopulation === "cross";
    const effectiveMutualOnly = mutualLocked ? false : mutualOnly;

    const cyRef = useRef<Core | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastCyInstance = useRef<Core | null>(null);
    // Cytoscape's tap listeners are registered once; this ref lets them read
    // the latest view params instead of what was captured at registration time
    const viewRef = useRef<GraphViewParams>({
        nodeFilter: effectiveNodeFilter,
        edgeFilter: {
            population: effectiveEdgePopulation,
            mutualOnly: effectiveMutualOnly,
            showEdges,
        },
        continentFilters,
        focusedNodeId,
        contradictionsOnly,
        showContradictionPath,
    });

    useEffect(() => {
        import("../assets/data/json/graph_data.json").then((mod) => {
            setGraphData(mod.default as GraphData);
        });
    }, []);

    const sharkContinentMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const shark of mediaSharks) {
            if (shark.continent) {
                const continents = extractContinents(shark.continent);
                map.set(shark.id, continents[0] ?? "Unknown");
            } else {
                map.set(shark.id, "Unknown");
            }
        }
        return map;
    }, []);

    const nodes = useMemo(() => graphData?.nodes ?? [], [graphData]);
    const edges = useMemo(() => graphData?.edges ?? [], [graphData]);
    const contradictions = useMemo(() => graphData?.contradictions ?? [], [graphData]);

    const posMap = useMemo(() => normalizePositions(nodes), [nodes]);
    const elements = useMemo(
        () => buildElements(nodes, edges, posMap, sharkContinentMap, contradictions),
        [nodes, edges, posMap, sharkContinentMap, contradictions]
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
        const params: GraphViewParams = {
            nodeFilter: effectiveNodeFilter,
            edgeFilter: {
                population: effectiveEdgePopulation,
                mutualOnly: effectiveMutualOnly,
                showEdges,
            },
            continentFilters,
            focusedNodeId,
            contradictionsOnly,
            showContradictionPath,
        };
        viewRef.current = params;
        if (cyRef.current) applyGraphView(cyRef.current, params);
    }, [
        effectiveNodeFilter,
        effectiveEdgePopulation,
        effectiveMutualOnly,
        showEdges,
        continentFilters,
        focusedNodeId,
        contradictionsOnly,
        showContradictionPath,
    ]);

    // The path toggle is contextual to whichever contradiction node is
    // currently focused; reset it so it doesn't silently carry over
    useEffect(() => {
        setShowContradictionPath(false);
    }, [focusedNodeId]);

    // A continent only applies to GBIF sharks, so picking "All nodes" or
    // "Ningaloo only" clears any active continent selection (and vice versa:
    // picking a continent while "Ningaloo only" is active resets to "All nodes")
    const handleNodeFilterClick = useCallback((filter: NodeFilter) => {
        setNodeFilter(filter);
        if (filter !== "gbif") setContinentFilters(new Set());
    }, []);

    const toggleContinent = useCallback((name: string) => {
        setContinentFilters((prev) => {
            const next = new Set(prev);
            if (next.has(name)) {
                next.delete(name);
            } else {
                next.add(name);
            }
            return next;
        });
        setNodeFilter((current) => (current === "ningaloo" ? "all" : current));
    }, []);

    return (
        <div className="shark-match-graph-section">
            <div className="graph-header">
                <h2>Identity Match Graph</h2>
                <p>
                    Each node is a whale shark image, colored by the continent where it was
                    recorded. Gray squares are Ningaloo reference images. Nearby nodes are visually
                    similar images, according to the computer vision model. Click any node to
                    highlight its nearest embedding match and see details.
                </p>
                <div className="graph-legend">
                    <span className="legend-square" style={{ background: NINGALOO_COLOR }} />
                    <span className="legend-label">Ningaloo (reference)</span>
                    {(Object.entries(CONTINENT_COLORS) as [string, string][])
                        .filter(([name]) => name !== "Unknown")
                        .map(([name, color]) => (
                            <span key={name} style={{ display: "contents" }}>
                                <span className="legend-dot" style={{ background: color }} />
                                <span className="legend-label">{name}</span>
                            </span>
                        ))}
                    <span className="legend-dot legend-dot--contradiction" />
                    <span className="legend-label">
                        Contradiction (chain implies an impossible match)
                    </span>
                </div>
            </div>

            <div className="graph-controls">
                <div className="filter-group">
                    {(Object.keys(NODE_FILTER_LABELS) as NodeFilter[]).map((f) => (
                        <button
                            key={f}
                            className={`graph-filter-btn${effectiveNodeFilter === f ? " active" : ""}`}
                            onClick={() => handleNodeFilterClick(f)}
                        >
                            {NODE_FILTER_LABELS[f]}
                        </button>
                    ))}
                </div>
                <div className="filter-group">
                    <button
                        className={`graph-filter-btn${continentFilters.size === 0 ? " active" : ""}`}
                        onClick={() => setContinentFilters(new Set())}
                    >
                        All regions
                    </button>
                    {CONTINENT_NAMES.map((name) => (
                        <button
                            key={name}
                            className={`graph-filter-btn${continentFilters.has(name) ? " active" : ""}`}
                            onClick={() => toggleContinent(name)}
                        >
                            {CONTINENT_LABEL[name]}
                        </button>
                    ))}
                </div>
                <div className="filter-group">
                    {(Object.keys(EDGE_POPULATION_LABELS) as EdgePopulationFilter[]).map((f) => (
                        <button
                            key={f}
                            className={`graph-filter-btn${effectiveEdgePopulation === f ? " active" : ""}`}
                            disabled={edgePopulationLocked}
                            onClick={() => setEdgePopulationFilter(f)}
                        >
                            {EDGE_POPULATION_LABELS[f]}
                        </button>
                    ))}
                    <button
                        className={`graph-filter-btn${effectiveMutualOnly ? " active" : ""}`}
                        disabled={mutualLocked}
                        onClick={() => setMutualOnly((m) => !m)}
                    >
                        Mutual matches only
                    </button>
                    <button
                        className={`graph-filter-btn${showEdges ? " active" : ""}`}
                        onClick={() => setShowEdges((s) => !s)}
                    >
                        Show match lines
                    </button>
                    <button
                        className={`graph-filter-btn${contradictionsOnly ? " active" : ""}`}
                        onClick={() => setContradictionsOnly((c) => !c)}
                    >
                        Contradictions only
                    </button>
                </div>
            </div>

            <div className="graph-canvas-row">
                <div ref={containerRef} className="cytoscape-canvas">
                    {!graphData ? (
                        <div className="graph-loading">Loading graph…</div>
                    ) : (
                        <CytoscapeComponent
                            elements={elements}
                            stylesheet={GRAPH_STYLESHEET}
                            layout={{ name: "preset" }}
                            style={{
                                width: "100%",
                                height: "100%",
                                position: "absolute",
                                top: "0",
                                left: "0",
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
                                    initCyListeners(
                                        cy,
                                        viewRef,
                                        setSelectedMatch,
                                        setFocusedNodeId
                                    );
                                }
                            }}
                        />
                    )}
                </div>
                <GraphNodePanel
                    match={selectedMatch}
                    onClose={() => setSelectedMatch(null)}
                    showContradictionPath={showContradictionPath}
                    onToggleContradictionPath={() => setShowContradictionPath((p) => !p)}
                />
                <GraphSharkImagesPanel
                    match={selectedMatch}
                    onClose={() => setSelectedMatch(null)}
                />
            </div>
        </div>
    );
}

export default SharkMatchGraph;
