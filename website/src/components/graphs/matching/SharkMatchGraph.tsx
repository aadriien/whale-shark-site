import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import type { Core } from "cytoscape";

import GraphNodePanel from "./GraphNodePanel";
import GraphSharkImagesPanel from "./GraphSharkImagesPanel";
import FilterButton from "../../controls/FilterButton";
import {
    buildGraphStylesheet,
    DISTANCE_RANGE_DEFAULT,
    isDistanceFiltering,
    normalizePositions,
    buildElements,
    applyGraphView,
    initCyListeners,
    resolveFilters,
    findBestMatch,
} from "../../../utils/GraphUtils";
import { useGraphTheme } from "../../../hooks/useGraphTheme";
import { useCyResize } from "../../../hooks/useCyResize";
import { useSharkContinentMap } from "../../../hooks/useSharkContinentMap";
import { useSavedSharkIds } from "../../../hooks/useSavedSharkIds";

import {
    NodeFilter,
    EdgePopulationFilter,
    FilterKey,
    GraphViewParams,
    GraphData,
    SelectedMatch,
} from "../../../types/graphs";

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

function SharkMatchGraph() {
    const { colors: graphColors, stylesheet: graphStylesheet } =
        useGraphTheme(buildGraphStylesheet);

    // The 9 filter dimensions start with nothing active (show all).
    // "continents" is derived from continentFilters being non-empty.
    const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());
    const [continentFilters, setContinentFilters] = useState<Set<string>>(new Set());

    const [distanceRange, setDistanceRange] = useState<[number, number]>(DISTANCE_RANGE_DEFAULT);

    const [showContradictionPath, setShowContradictionPath] = useState(false);

    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [graphLoadError, setGraphLoadError] = useState<string | null>(null);

    const [selectedMatch, setSelectedMatch] = useState<SelectedMatch | null>(null);
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

    // FILTER_CONSTRAINTS resolves cross-filter dependencies (e.g. "mutual
    // matches only" implies GBIF-only nodes, which implies GBIF x GBIF edges).
    // `active` is the fully-resolved filter state applied to the graph.
    // `locked` flags are the dependency / ripple effect of related filters.
    const userActiveFilters = useMemo(() => {
        const next = new Set(activeFilters);
        if (continentFilters.size > 0) next.add("continents");
        if (isDistanceFiltering(distanceRange)) next.delete("ningaloo_only");
        return next;
    }, [activeFilters, continentFilters, distanceRange]);

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
    const savedOnly = active.has("saved_only");

    const savedSharkIds = useSavedSharkIds();

    // gbif_only/gbif_gbif are only ever forced ON by other filters, and
    // ningaloo_only/gbif_ningaloo are only ever forced OFF. So a forced-on
    // "true" key locks both itself and "all/none" (that option becomes
    // unreachable), while a forced-off "false" key only locks itself.
    const distanceActive = isDistanceFiltering(distanceRange);
    const nodeFilterLocked: Record<NodeFilter, boolean> = {
        all: locked.has("gbif_only"),
        gbif: locked.has("gbif_only"),
        ningaloo: locked.has("ningaloo_only") || distanceActive,
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
    const savedOnlyLocked = locked.has("saved_only");

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
            distanceRange,
        },
        continentFilters,
        focusedNodeId,
        noContradictions,
        contradictionsOnly,
        showContradictionPath,
        colors: graphColors,
        savedOnly,
        savedSharkIds,
    });

    useEffect(() => {
        import("../../../assets/data/json/matching/plausible/graph_data.json")
            .then((mod) => {
                setGraphData(mod.default as GraphData);
            })
            .catch((err) => {
                console.error("Failed to load match graph data:", err);
                setGraphLoadError("Failed to load graph data. Check the console for details.");
            });
    }, []);

    const sharkContinentMap = useSharkContinentMap();

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

    useCyResize(containerRef, cyRef);

    useEffect(() => {
        const params: GraphViewParams = {
            nodeFilter,
            edgeFilter: {
                population: edgePopulation,
                mutualOnly,
                hideEdges,
                distanceRange,
            },
            continentFilters,
            focusedNodeId,
            noContradictions,
            contradictionsOnly,
            showContradictionPath,
            colors: graphColors,
            savedOnly,
            savedSharkIds,
        };
        viewRef.current = params;
        if (cyRef.current) applyGraphView(cyRef.current, params);
    }, [
        nodeFilter,
        edgePopulation,
        mutualOnly,
        hideEdges,
        distanceRange,
        continentFilters,
        focusedNodeId,
        noContradictions,
        contradictionsOnly,
        showContradictionPath,
        graphColors,
        savedOnly,
        savedSharkIds,
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
                    <span className="legend-square" style={{ background: graphColors.ningaloo }} />
                    <span className="legend-label">Ningaloo (reference)</span>
                    {(Object.entries(graphColors.continents) as [string, string][])
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
                        <FilterButton
                            key={f}
                            active={nodeFilter === f}
                            disabled={nodeFilterLocked[f]}
                            onClick={() => handleNodeFilterClick(f)}
                        >
                            {NODE_FILTER_LABELS[f]}
                        </FilterButton>
                    ))}
                    <FilterButton
                        active={savedOnly}
                        disabled={savedOnlyLocked}
                        onClick={() => toggleFilter("saved_only")}
                    >
                        My Saved Sharks Only
                    </FilterButton>
                </div>
                <div className="filter-group">
                    <FilterButton
                        active={continentFilters.size === 0}
                        disabled={continentsLocked}
                        onClick={() => setContinentFilters(new Set())}
                    >
                        All regions
                    </FilterButton>
                    {CONTINENT_NAMES.map((name) => (
                        <FilterButton
                            key={name}
                            active={continentFilters.has(name)}
                            disabled={continentsLocked}
                            onClick={() => toggleContinent(name)}
                        >
                            {CONTINENT_LABEL[name]}
                        </FilterButton>
                    ))}
                </div>
                <div className="filter-group">
                    {(Object.keys(EDGE_POPULATION_LABELS) as EdgePopulationFilter[]).map((f) => (
                        <FilterButton
                            key={f}
                            active={edgePopulation === f}
                            disabled={edgePopulationLocked[f]}
                            onClick={() => handleEdgePopulationClick(f)}
                        >
                            {EDGE_POPULATION_LABELS[f]}
                        </FilterButton>
                    ))}
                    <FilterButton
                        active={mutualOnly}
                        disabled={mutualLocked}
                        onClick={() => toggleFilter("mutual_only")}
                    >
                        Mutual matches only
                    </FilterButton>
                    <FilterButton
                        active={hideEdges}
                        disabled={hideEdgesLocked}
                        onClick={() => toggleFilter("hide_edges")}
                    >
                        Hide match lines
                    </FilterButton>
                    <FilterButton
                        active={noContradictions}
                        disabled={noContradictionsLocked}
                        onClick={() => toggleFilter("no_contradictions")}
                    >
                        No transitive contradictions
                    </FilterButton>
                    <FilterButton
                        active={contradictionsOnly}
                        disabled={contradictionsOnlyLocked}
                        onClick={() => toggleFilter("contradictions_only")}
                    >
                        Contradictions only
                    </FilterButton>
                    <label className="graph-distance-range">
                        Distance:
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max={distanceRange[1]}
                            value={distanceRange[0]}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) setDistanceRange([val, distanceRange[1]]);
                            }}
                            className="graph-range-input"
                        />
                        <span>to</span>
                        <input
                            type="number"
                            step="0.1"
                            min={distanceRange[0]}
                            value={distanceRange[1]}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) setDistanceRange([distanceRange[0], val]);
                            }}
                            className="graph-range-input"
                        />
                    </label>
                </div>
            </div>

            <div className="graph-canvas-row">
                <GraphNodePanel
                    match={selectedMatch}
                    showContradictionPath={showContradictionPath}
                    onToggleContradictionPath={() => setShowContradictionPath((p) => !p)}
                />
                <div ref={containerRef} className="cytoscape-canvas">
                    {graphLoadError ? (
                        <div className="graph-loading">{graphLoadError}</div>
                    ) : !graphData ? (
                        <div className="graph-loading">Loading graph…</div>
                    ) : (
                        <CytoscapeComponent
                            elements={elements}
                            stylesheet={graphStylesheet}
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
                <GraphSharkImagesPanel
                    match={selectedMatch}
                    cy={cyRef.current}
                    onSelectImage={handleSelectImage}
                />
            </div>
        </div>
    );
}

export default SharkMatchGraph;