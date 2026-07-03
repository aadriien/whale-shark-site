import { toggleMatchedPair, isMatchedPair } from "../../utils/MatchUtils";
import { useMatchedPairs } from "../../hooks/useMatchedPairs";

import { MatchButtonProps } from "../../types/logbooks";

const MatchButton = ({
    querySharkId,
    matchedSharkId,
    className = "graph-panel-match-btn",
}: MatchButtonProps) => {
    // Subscribes to matched-pair changes so this re-renders when they occur
    useMatchedPairs();

    const saved = isMatchedPair(querySharkId, matchedSharkId);

    return (
        <button
            className={`${className}${saved ? " active" : ""}`}
            onClick={(e) => {
                e.stopPropagation();
                toggleMatchedPair(querySharkId, matchedSharkId);
            }}
        >
            {saved ? "✓ Match pair saved" : "Save this match pair"}
        </button>
    );
};

export default MatchButton;