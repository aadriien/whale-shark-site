import { useMemo } from "react";

import { useMatchedGroups } from "./useMatchedGroups";

import { MatchedSharkIDs } from "../types/logbooks";

// Flattens user's saved shark matches groups into a single reactive set
export function useMatchedSharkIds(): MatchedSharkIDs {
    const groups = useMatchedGroups();

    return useMemo(() => new Set(groups.flatMap((g) => g.sharkIds)), [groups]);
}