import { useEffect, useState } from "react";

import { SheetSnap } from "../types/sheets";

// Starts sheet collapsed, then opens it to selection's tab whenever selection changes
export function useSheetSelection(selectionKey: string | null, selectionTab: string) {
    const [tab, setTab] = useState(selectionTab);
    const [snap, setSnap] = useState<SheetSnap>("peek");

    useEffect(() => {
        if (selectionKey === null) return;
        setTab(selectionTab);
        setSnap((prev) => (prev === "peek" ? "half" : prev));
    }, [selectionKey, selectionTab]);

    return { tab, setTab, snap, setSnap };
}
