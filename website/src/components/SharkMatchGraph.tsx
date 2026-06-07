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
    applyFilters,
    initCyListeners,
} from "../utils/GraphUtils";
import { mediaSharks, extractContinents } from "../utils/DataUtils";

import { NodeFilter, EdgeFilter, GraphData, SelectedMatch } from "../types/graphs";

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
    const [edgeFilter, setEdgeFilter] = useState<EdgeFilter>("all");
    const [continentFilters, setContinentFilters] = useState<Set<string>>(new Set());
    const [graphData, setGraphData] = useState<GraphData | null>(null);

    const [selectedMatch, setSelectedMatch] = useState<SelectedMatch | null>(null);

    const cyRef = useRef<Core | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastCyInstance = useRef<Core | null>(null);
    // Cytoscape tap listeners are registered once; this ref lets them read
    // latest edge toggle value instead of what's captured at registration time
    const edgeFilterRef = useRef<EdgeFilter>(edgeFilter);

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

    const posMap = useMemo(() => normalizePositions(nodes), [nodes]);
    const elements = useMemo(
        () => buildElements(nodes, edges, posMap, sharkContinentMap),
        [nodes, edges, posMap, sharkContinentMap]
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
        edgeFilterRef.current = edgeFilter;
        if (cyRef.current) applyFilters(cyRef.current, nodeFilter, edgeFilter, continentFilters);
    }, [nodeFilter, edgeFilter, continentFilters]);

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
                                        nodeFilter,
                                        edgeFilterRef,
                                        continentFilters,
                                        setSelectedMatch
                                    );
                                }
                            }}
                        />
                    )}
                </div>
                <GraphNodePanel match={selectedMatch} onClose={() => setSelectedMatch(null)} />
                <GraphSharkImagesPanel match={selectedMatch} onClose={() => setSelectedMatch(null)} />
            </div>
        </div>
    );
}

export default SharkMatchGraph;
