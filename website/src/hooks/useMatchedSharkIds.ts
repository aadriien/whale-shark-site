import { useMemo } from "react";

import { useMatchedGroups } from "./useMatchedGroups";

import { MatchedSharkIDs } from "../types/logbooks";

// Flattens user's saved shark matches groups into a single reactive set.
// Note that solo (1-shark) groups are excluded, since not an actual match
export function useMatchedSharkIds(): MatchedSharkIDs {
    const groups = useMatchedGroups();

    return useMemo(
        () => new Set(groups.filter((g) => g.sharkIds.length >= 2).flatMap((g) => g.sharkIds)),
        [groups]
    );
}
