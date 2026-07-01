const POSITION_SCALE = 5000;
export const EDGE_OPACITY_MIN = 0.15;

export function normalizePositions<N extends { id: string; x: number; y: number }>(
    nodes: N[]
): Map<string, { x: number; y: number }> {
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);

    const xMin = Math.min(...xs),
        xMax = Math.max(...xs);
    const yMin = Math.min(...ys),
        yMax = Math.max(...ys);

    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    const posMap = new Map<string, { x: number; y: number }>();
    for (const node of nodes) {
        posMap.set(node.id, {
            x: ((node.x - xMin) / xRange) * POSITION_SCALE,
            y: ((node.y - yMin) / yRange) * POSITION_SCALE,
        });
    }
    return posMap;
}

export function isDistanceFiltering(range: [number, number], defaultRange: [number, number]): boolean {
    return range[0] > defaultRange[0] || range[1] < defaultRange[1];
}
