import { useEffect } from "react";
import type { RefObject } from "react";
import type { Core } from "cytoscape";

// Keeps the Cytoscape canvas sized & fit to its container as the container resizes
export function useCyResize(containerRef: RefObject<HTMLDivElement | null>, cyRef: RefObject<Core | null>) {
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new ResizeObserver(() => {
            cyRef.current?.resize();
            cyRef.current?.fit();
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [containerRef, cyRef]);
}
