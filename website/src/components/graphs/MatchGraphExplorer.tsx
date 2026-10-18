import { useState } from "react";

import GraphHeader from "./GraphHeader";
import SharkMatchGraph from "./matching/SharkMatchGraph";
import SharkRankingGraph from "./ranking/SharkRankingGraph";

import { GraphHeaderOption, GraphView } from "../../types/graphs";

const GRAPH_OPTIONS: GraphHeaderOption[] = [
    {
        id: "identity",
        title: "Identity Match Graph",
        shortTitle: "Identity Graph",
        tagline: "Each node is one whale shark image, linked to the image it most resembles.",
        description:
            "Each node is one whale shark image, placed near images the computer vision model finds visually similar, and colored by the continent where it was recorded. Click a node to see its closest match and every other image of that shark.",
    },
    {
        id: "shark",
        title: "Shark-Level Match Graph",
        shortTitle: "Shark Graph",
        tagline: "Each node is one whale shark, linked to the shark it most resembles.",
        description:
            "Each node is one whale shark, positioned by the average of its MiewID image embeddings, and lines connect each shark to its closest aggregate shark match across all image pairs. Click a node to see the match breakdown.",
    },
];

function MatchGraphExplorer() {
    const [activeGraph, setActiveGraph] = useState<GraphView>("identity");

    return (
        <div className="shark-match-graph-section">
            <GraphHeader options={GRAPH_OPTIONS} activeId={activeGraph} onChange={setActiveGraph} />

            <div role="tabpanel">
                {activeGraph === "identity" ? <SharkMatchGraph /> : <SharkRankingGraph />}
            </div>
        </div>
    );
}

export default MatchGraphExplorer;
