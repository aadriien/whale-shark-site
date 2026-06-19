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
    resolveFilters,
    findBestMatch,
} from "../utils/GraphUtils";
import { mediaSharks, extractContinents } from "../utils/DataUtils";

import {
    NodeFilter,
    EdgePopulationFilter,
    FilterKey,
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
    // The 9 filter dimensions start with nothing active (show all).
    // "continents" is derived from continentFilters being non-empty.
    const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());
    const [continentFilters, setContinentFilters] = useState<Set<string>>(new Set());

    const [showContradictionPath, setShowContradictionPath] = useState(false);

    const [graphData, setGraphData] = useState<GraphData | null>(null);

    const [selectedMatch, setSelectedMatch] = useState<SelectedMatch | null>(null);
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

    // FILTER_CONSTRAINTS resolves cross-filter dependencies (e.g. "mutual
    // matches only" implies GBIF-only nodes, which implies GBIF x GBIF edges).
    // `active` is the fully-resolved filter state applied to the graph.
    // `locked` flags are the dependency / ripple effect of related filters.
    const userActiveFilters = useMemo(() => {
        const next = new Set(activeFilters);
        if (continentFilters.size > 0) next.add("continents");
        return next;
    }, [activeFilters, continentFilters]);

    const { active, locked } = useMemo(
        () => resolveFilters(userActiveFilters),
        [userActiveFilters]
    );

    const nodeFilter: NodeFilter = active.has("gbif_only")
        ? "gbif"
        : active.has("ningaloo_only")
          ? "ningaloo"
          : "all";
    const edgePopulation: EdgePopulationFilter = active.has("gbif_gbif")
        ? "same"
        : active.has("gbif_ningaloo")
          ? "cross"
          : "all";
    const mutualOnly = active.has("mutual_only");
    const noContradictions = active.has("no_contradictions");
    const contradictionsOnly = active.has("contradictions_only");
    const hideEdges = active.has("hide_edges");
    const strongOnly = active.has("strong_only");

    // gbif_only/gbif_gbif are only ever forced ON by other filters, and
    // ningaloo_only/gbif_ningaloo are only ever forced OFF. So a forced-on
    // "true" key locks both itself and "all/none" (that option becomes
    // unreachable), while a forced-off "false" key only locks itself.
    const nodeFilterLocked: Record<NodeFilter, boolean> = {
        all: locked.has("gbif_only"),
        gbif: locked.has("gbif_only"),
        ningaloo: locked.has("ningaloo_only"),
    };
    const continentsLocked = locked.has("continents");
    const edgePopulationLocked: Record<EdgePopulationFilter, boolean> = {
        all: locked.has("gbif_gbif"),
        same: locked.has("gbif_gbif"),
        cross: locked.has("gbif_ningaloo"),
    };
    const mutualLocked = locked.has("mutual_only");
    const noContradictionsLocked = locked.has("no_contradictions");
    const contradictionsOnlyLocked = locked.has("contradictions_only");
    const hideEdgesLocked = locked.has("hide_edges");
    const strongLocked = locked.has("strong_only");

    const cyRef = useRef<Core | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastCyInstance = useRef<Core | null>(null);
    // Cytoscape's tap listeners are registered once; this ref lets them read
    // the latest view params instead of what was captured at registration time
    const viewRef = useRef<GraphViewParams>({
        nodeFilter,
        edgeFilter: {
            population: edgePopulation,
            mutualOnly,
            hideEdges,
            strongOnly,
        },
        continentFilters,
        focusedNodeId,
        noContradictions,
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
    const contradictionsMutual = useMemo(() => graphData?.contradictions_mutual ?? [], [graphData]);
    const contradictionsAll = useMemo(() => graphData?.contradictions_all ?? [], [graphData]);

    const posMap = useMemo(() => normalizePositions(nodes), [nodes]);
    const elements = useMemo(
        () =>
            buildElements(
                nodes,
                edges,
                posMap,
                sharkContinentMap,
                contradictionsMutual,
                contradictionsAll
            ),
        [nodes, edges, posMap, sharkContinentMap, contradictionsMutual, contradictionsAll]
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
            nodeFilter,
            edgeFilter: {
                population: edgePopulation,
                mutualOnly,
                hideEdges,
                strongOnly,
            },
            continentFilters,
            focusedNodeId,
            noContradictions,
            contradictionsOnly,
            showContradictionPath,
        };
        viewRef.current = params;
        if (cyRef.current) applyGraphView(cyRef.current, params);
    }, [
        nodeFilter,
        edgePopulation,
        mutualOnly,
        hideEdges,
        strongOnly,
        continentFilters,
        focusedNodeId,
        noContradictions,
        contradictionsOnly,
        showContradictionPath,
    ]);

    // The path toggle is contextual to whichever contradiction node is
    // currently focused; reset it so it doesn't silently carry over
    useEffect(() => {
        setShowContradictionPath(false);
    }, [focusedNodeId]);

    // A continent only applies to GBIF sharks, so picking "All nodes" or
    // "Ningaloo only" clears any active continent selection. The reverse
    // (picking a continent while "Ningaloo only" is active) can't happen:
    // FILTER_CONSTRAINTS locks continent buttons when ningaloo_only is active.
    const handleNodeFilterClick = useCallback((filter: NodeFilter) => {
        setActiveFilters((prev) => {
            const next = new Set(prev);
            next.delete("gbif_only");
            next.delete("ningaloo_only");
            if (filter === "gbif") next.add("gbif_only");
            else if (filter === "ningaloo") next.add("ningaloo_only");
            return next;
        });
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
    }, []);

    const handleEdgePopulationClick = useCallback((filter: EdgePopulationFilter) => {
        setActiveFilters((prev) => {
            const next = new Set(prev);
            next.delete("gbif_gbif");
            next.delete("gbif_ningaloo");
            if (filter === "same") next.add("gbif_gbif");
            else if (filter === "cross") next.add("gbif_ningaloo");
            return next;
        });
    }, []);

    const toggleFilter = useCallback((key: FilterKey) => {
        setActiveFilters((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }, []);

    // Selecting an image from the side panel acts like clicking its node
    const handleSelectImage = useCallback((imageId: number) => {
        const cy = cyRef.current;
        if (!cy) return;

        const nodeId = `gbif_${imageId}`;
        const node = cy.getElementById(nodeId);
        if (node.empty()) return;

        setFocusedNodeId(nodeId);
        const match = findBestMatch(cy, nodeId);
        if (match) setSelectedMatch(match);
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
                            className={`graph-filter-btn${nodeFilter === f ? " active" : ""}`}
                            disabled={nodeFilterLocked[f]}
                            onClick={() => handleNodeFilterClick(f)}
                        >
                            {NODE_FILTER_LABELS[f]}
                        </button>
                    ))}
                </div>
                <div className="filter-group">
                    <button
                        className={`graph-filter-btn${continentFilters.size === 0 ? " active" : ""}`}
                        disabled={continentsLocked}
                        onClick={() => setContinentFilters(new Set())}
                    >
                        All regions
                    </button>
                    {CONTINENT_NAMES.map((name) => (
                        <button
                            key={name}
                            className={`graph-filter-btn${continentFilters.has(name) ? " active" : ""}`}
                            disabled={continentsLocked}
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
                            className={`graph-filter-btn${edgePopulation === f ? " active" : ""}`}
                            disabled={edgePopulationLocked[f]}
                            onClick={() => handleEdgePopulationClick(f)}
                        >
                            {EDGE_POPULATION_LABELS[f]}
                        </button>
                    ))}
                    <button
                        className={`graph-filter-btn${mutualOnly ? " active" : ""}`}
                        disabled={mutualLocked}
                        onClick={() => toggleFilter("mutual_only")}
                    >
                        Mutual matches only
                    </button>
                    <button
                        className={`graph-filter-btn${hideEdges ? " active" : ""}`}
                        disabled={hideEdgesLocked}
                        onClick={() => toggleFilter("hide_edges")}
                    >
                        Hide match lines
                    </button>
                    <button
                        className={`graph-filter-btn${noContradictions ? " active" : ""}`}
                        disabled={noContradictionsLocked}
                        onClick={() => toggleFilter("no_contradictions")}
                    >
                        No transitive contradictions
                    </button>
                    <button
                        className={`graph-filter-btn${contradictionsOnly ? " active" : ""}`}
                        disabled={contradictionsOnlyLocked}
                        onClick={() => toggleFilter("contradictions_only")}
                    >
                        Contradictions only
                    </button>
                    <button
                        className={`graph-filter-btn${strongOnly ? " active" : ""}`}
                        disabled={strongLocked}
                        onClick={() => toggleFilter("strong_only")}
                    >
                        Strong matches only
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
                    onSelectImage={handleSelectImage}
                />
            </div>
        </div>
    );
}

export default SharkMatchGraph;
