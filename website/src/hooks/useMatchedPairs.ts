import { useState, useEffect } from "react";

import { getMatchedPairKeys } from "../utils/MatchUtils";

// Single reactive source of truth for saved match-pair keys, kept in sync
// with MatchUtils' localStorage state. Same-tab toggles will dispatch
// "matchedPairsChanged", while cross-tab edits fire native "storage" event
export function useMatchedPairs(): Set<string> {
    const [matchedPairs, setMatchedPairs] = useState<Set<string>>(getMatchedPairKeys);

    useEffect(() => {
        const handleChange = () => setMatchedPairs(getMatchedPairKeys());

        window.addEventListener("matchedPairsChanged", handleChange);
        window.addEventListener("storage", handleChange);

        return () => {
            window.removeEventListener("matchedPairsChanged", handleChange);
            window.removeEventListener("storage", handleChange);
        };
    }, []);

    return matchedPairs;
}