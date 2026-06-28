import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import type { Core } from "cytoscape";

import SharkRankingNodePanel from "./SharkRankingNodePanel";
import SharkRankingStatsPanel from "./SharkRankingStatsPanel";
import { getGraphColors } from "../../utils/GraphUtils";
import {
    buildGraphStylesheet,
    DISTANCE_RANGE_DEFAULT,
    normalizePositions,
    buildElements,
    applyGraphView,
    initCyListeners,
    resolveFilters,
    findBestMatch,
} from "./SharkRankingGraphUtils";
import { mediaSharks, extractContinents } from "../../utils/DataUtils";

import {
    SharkRankingFilterKey,
    SharkRankingViewParams,
    SharkRankingGraphData,
    SelectedSharkMatch,
} from "../../types/shark-ranking-graphs";

const CONTINENT_NAMES: string[] = [
    "North America",
    "Asia",
    "Oceania",
    "Africa",
    "South America",
    "Europe",
];

function SharkRankingGraph() {
    const [isDark, setIsDark] = useState(
        () => document.documentElement.getAttribute("data-theme") === "dark"
    );
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"],
        });
        return () => observer.disconnect();
    }, []);

    const graphColors = useMemo(() => getGraphColors(isDark), [isDark]);
    const graphStylesheet = useMemo(() => buildGraphStylesheet(graphColors), [graphColors]);

    const [activeFilters, setActiveFilters] = useState<Set<SharkRankingFilterKey>>(new Set());
    const [continentFilters, setContinentFilters] = useState<Set<string>>(new Set());
    const [distanceRange, setDistanceRange] = useState<[number, number]>(DISTANCE_RANGE_DEFAULT);

    const [showContradictionPath, setShowContradictionPath] = useState(false);

    const [graphData, setGraphData] = useState<SharkRankingGraphData | null>(null);

    const [selectedMatch, setSelectedMatch] = useState<SelectedSharkMatch | null>(null);
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

    const userActiveFilters = useMemo(() => {
        const next = new Set(activeFilters);
        if (continentFilters.size > 0) next.add("continents");
        return next;
    }, [activeFilters, continentFilters]);

    const { active, locked } = useMemo(
        () => resolveFilters(userActiveFilters),
        [userActiveFilters]
    );

    const mutualOnly = active.has("mutual_only");
    const noContradictions = active.has("no_contradictions");
    const contradictionsOnly = active.has("contradictions_only");
    const hideEdges = active.has("hide_edges");

    const continentsLocked = locked.has("continents");
    const mutualLocked = locked.has("mutual_only");
    const noContradictionsLocked = locked.has("no_contradictions");
    const contradictionsOnlyLocked = locked.has("contradictions_only");
    const hideEdgesLocked = locked.has("hide_edges");

    const cyRef = useRef<Core | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastCyInstance = useRef<Core | null>(null);
    const viewRef = useRef<SharkRankingViewParams>({
        edgeFilter: {
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
    });

    useEffect(() => {
        import("../../assets/data/json/shark-ranking/shark_graph_data.json").then((mod) => {
            setGraphData(mod.default as SharkRankingGraphData);
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
        const params: SharkRankingViewParams = {
            edgeFilter: {
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
        };
        viewRef.current = params;
        if (cyRef.current) applyGraphView(cyRef.current, params);
    }, [
        mutualOnly,
        hideEdges,
        distanceRange,
        continentFilters,
        focusedNodeId,
        noContradictions,
        contradictionsOnly,
        showContradictionPath,
        graphColors,
    ]);

    useEffect(() => {
        setShowContradictionPath(false);
    }, [focusedNodeId]);

    const toggleContinent = useCallback((name: string) => {
        setContinentFilters((prev) => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    }, []);

    const toggleFilter = useCallback((key: SharkRankingFilterKey) => {
        setActiveFilters((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }, []);

    const handleSelectNode = useCallback((nodeId: string) => {
        const cy = cyRef.current;
        if (!cy) return;

        const node = cy.getElementById(nodeId);
        if (node.empty()) return;

        setFocusedNodeId(nodeId);
        const match = findBestMatch(cy, nodeId);
        if (match) setSelectedMatch(match);
    }, []);

    // Allow clicking a shark ID in the stats panel to navigate to that node
    void handleSelectNode;

    return (
        <div className="shark-match-graph-section">
            <div className="graph-header">
                <h2>Shark-Level Match Graph</h2>
                <p>
                    Each node is a whale shark, positioned by the average of its MiewID image
                    embeddings. Edges connect each shark to its closest aggregate match across all
                    image pairs. Click any node to see the match breakdown.
                </p>
                <div className="graph-legend">
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
                            {name}
                        </button>
                    ))}
                </div>
                <div className="filter-group">
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
                    <label className="graph-distance-range">
                        Median image distance:
                        <input
                            type="number"
                            step="0.01"
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
                            step="0.01"
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
                <SharkRankingNodePanel
                    match={selectedMatch}
                    onClose={() => setSelectedMatch(null)}
                    showContradictionPath={showContradictionPath}
                    onToggleContradictionPath={() => setShowContradictionPath((p) => !p)}
                />
                <div ref={containerRef} className="cytoscape-canvas">
                    {!graphData ? (
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
                <SharkRankingStatsPanel
                    match={selectedMatch}
                    onClose={() => setSelectedMatch(null)}
                />
            </div>
        </div>
    );
}

export default SharkRankingGraph;
