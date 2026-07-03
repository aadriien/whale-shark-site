import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import type { Core } from "cytoscape";

import SharkRankingNodePanel from "./SharkRankingNodePanel";
import SharkRankingStatsPanel from "./SharkRankingStatsPanel";
import FilterButton from "../../controls/FilterButton";
import {
    buildGraphStylesheet,
    DISTANCE_RANGE_DEFAULT,
    normalizePositions,
    buildElements,
    applyGraphView,
    initCyListeners,
    resolveFilters,
    findBestMatch,
} from "../../../utils/SharkRankingGraphUtils";
import { useGraphTheme } from "../../../hooks/useGraphTheme";
import { useCyResize } from "../../../hooks/useCyResize";
import { useSharkContinentMap } from "../../../hooks/useSharkContinentMap";
import { useSavedSharkIds } from "../../../hooks/useSavedSharkIds";

import {
    SharkRankingFilterKey,
    SharkRankingViewParams,
    SharkRankingGraphData,
    SelectedSharkMatch,
} from "../../../types/graphs";

const CONTINENT_NAMES: string[] = [
    "North America",
    "Asia",
    "Oceania",
    "Africa",
    "South America",
    "Europe",
];

function SharkRankingGraph() {
    const { colors: graphColors, stylesheet: graphStylesheet } =
        useGraphTheme(buildGraphStylesheet);

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
    const savedOnly = active.has("saved_only");

    const savedSharkIds = useSavedSharkIds();

    const continentsLocked = locked.has("continents");
    const mutualLocked = locked.has("mutual_only");
    const noContradictionsLocked = locked.has("no_contradictions");
    const contradictionsOnlyLocked = locked.has("contradictions_only");
    const hideEdgesLocked = locked.has("hide_edges");
    const savedOnlyLocked = locked.has("saved_only");

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
        savedOnly,
        savedSharkIds,
    });

    useEffect(() => {
        import("../../../assets/data/json/matching/ranking/shark_graph_data.json").then((mod) => {
            setGraphData(mod.default as SharkRankingGraphData);
        });
    }, []);

    const sharkContinentMap = useSharkContinentMap();

    const nodes = useMemo(() => graphData?.nodes ?? [], [graphData]);
    const edges = useMemo(() => graphData?.edges ?? [], [graphData]);
    const contradictions = useMemo(() => graphData?.contradictions ?? [], [graphData]);

    const posMap = useMemo(() => normalizePositions(nodes), [nodes]);
    const elements = useMemo(
        () => buildElements(nodes, edges, posMap, sharkContinentMap, contradictions),
        [nodes, edges, posMap, sharkContinentMap, contradictions]
    );

    useCyResize(containerRef, cyRef);

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
            savedOnly,
            savedSharkIds,
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
        savedOnly,
        savedSharkIds,
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
                            {name}
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
                        active={
                            !mutualOnly && !hideEdges && !noContradictions && !contradictionsOnly
                        }
                        disabled={
                            mutualLocked &&
                            hideEdgesLocked &&
                            noContradictionsLocked &&
                            contradictionsOnlyLocked
                        }
                        onClick={() => setActiveFilters(new Set())}
                    >
                        All matches
                    </FilterButton>
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
                        Median image distance:
                        <input
                            type="number"
                            step="0.05"
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
                            step="0.05"
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
                <SharkRankingStatsPanel match={selectedMatch} />
            </div>
        </div>
    );
}

export default SharkRankingGraph;
