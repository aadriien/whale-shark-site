import { useMemo } from "react";

import { mediaSharks, extractContinents } from "../utils/DataUtils";

// Each shark's primary continent, keyed by shark ID, for coloring graph nodes
export function useSharkContinentMap(): Map<string, string> {
    return useMemo(() => {
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
}
