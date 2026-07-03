export const NODE_SCALE_MIN = 1;
export const NODE_SCALE_MAX = 2.5;

// Enlarges nodes as the visible graph gets sparser (e.g. filters applied),
// so small clusters remain easy to see
export function computeNodeSizeScale(visibleCount: number, totalCount: number): number {
    if (totalCount <= 0 || visibleCount <= 0) return NODE_SCALE_MAX;

    // Use sqrt(1/density) rather than straight inverse ratio so growth
    // curve stays gradual, i.e. no exploding size when visibleCount low
    const density = visibleCount / totalCount;
    const scale = Math.sqrt(1 / density);
    return Math.min(NODE_SCALE_MAX, Math.max(NODE_SCALE_MIN, scale));
}
