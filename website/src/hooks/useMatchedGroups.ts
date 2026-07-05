import { useState, useEffect } from "react";

import { getGroups } from "../utils/MatchUtils";

import { MatchGroup } from "../types/logbooks";

// Single reactive source of truth for saved match groups, kept in sync
// with MatchUtils' localStorage state. Same-tab edits dispatch
// "matchedGroupsChanged", while cross-tab edits fire native "storage" event
export function useMatchedGroups(): MatchGroup[] {
    const [groups, setGroups] = useState<MatchGroup[]>(getGroups);

    useEffect(() => {
        const handleChange = () => setGroups(getGroups());

        window.addEventListener("matchedGroupsChanged", handleChange);
        window.addEventListener("storage", handleChange);

        return () => {
            window.removeEventListener("matchedGroupsChanged", handleChange);
            window.removeEventListener("storage", handleChange);
        };
    }, []);

    return groups;
}