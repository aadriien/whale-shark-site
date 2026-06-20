import {
    SHARK_MAP,
    POINT_TO_SHARK_ID,
    sharkMarkerHtml,
    SHARK_MARKER_SIZE,
} from "./OceanViewerUtils";

import { PlottedCoordinatePoint } from "../types/coordinates";

// Zoom-dependent clustering: loose radius when zoomed out, tight when zoomed in
const CLUSTER_RADIUS_MAX_DEG = 3;
const CLUSTER_RADIUS_MIN_DEG = 0.5;
const ZOOM_MIN = 1.5;
const ZOOM_MAX = 5;

export type ClusteredSharkObjs = {
    lat: number;
    lng: number;
    count: number;
    pt: PlottedCoordinatePoint;
};

export function getClusterRadius(zoom: number): number {
    const t = Math.min(1, Math.max(0, (zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)));
    return CLUSTER_RADIUS_MAX_DEG - t * (CLUSTER_RADIUS_MAX_DEG - CLUSTER_RADIUS_MIN_DEG);
}

export function clusterSharkObservations(
    points: PlottedCoordinatePoint[],
    radiusDeg: number
): ClusteredSharkObjs[] {
    const coordsByShark = new Map<string, PlottedCoordinatePoint[]>();
    for (const pt of points) {
        const sharkID = POINT_TO_SHARK_ID.get(pt.id) ?? pt.id;
        const group = coordsByShark.get(sharkID);

        if (group) group.push(pt);
        else coordsByShark.set(sharkID, [pt]);
    }

    const result: ClusteredSharkObjs[] = [];
    const r2 = radiusDeg * radiusDeg;

    for (const sharkPoints of coordsByShark.values()) {
        if (sharkPoints.length === 1) {
            result.push({
                lat: sharkPoints[0].lat,
                lng: sharkPoints[0].lng,
                count: 1,
                pt: sharkPoints[0],
            });
            continue;
        }

        const clusters: ClusteredSharkObjs[] = [];
        for (const pt of sharkPoints) {
            let merged = false;

            for (const cluster of clusters) {
                const dlat = pt.lat - cluster.lat;
                const dlng = pt.lng - cluster.lng;

                // Group record clusters within same small grid area
                if (dlat * dlat + dlng * dlng <= r2) {
                    const n = cluster.count;
                    cluster.lat = (cluster.lat * n + pt.lat) / (n + 1);
                    cluster.lng = (cluster.lng * n + pt.lng) / (n + 1);

                    cluster.count++;
                    merged = true;
                    break;
                }
            }
            if (!merged) {
                clusters.push({ lat: pt.lat, lng: pt.lng, count: 1, pt });
            }
        }
        result.push(...clusters);
    }

    return result;
}

const MAX_COUNT_SCALE = 2.5;

export function createSharkMarkerEl(color: string, count: number, zoom: number): HTMLDivElement {
    // Scale SVG size with record count, but dampened for more gradual growth (capped)
    const countScale = Math.min(MAX_COUNT_SCALE, 1 + 0.5 * (Math.sqrt(count) - 1));

    // Also scale base size with zoom so markers aren't tiny when zoomed in
    const zoomScale = 1 + (zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN);

    const w = Math.round(SHARK_MARKER_SIZE[0] * countScale * zoomScale);
    const h = Math.round(SHARK_MARKER_SIZE[1] * countScale * zoomScale);

    const el = document.createElement("div");
    el.innerHTML = sharkMarkerHtml(color, w, h);
    el.style.cursor = "pointer";
    return el;
}

export function getSharkIDForPoint(pt: PlottedCoordinatePoint) {
    const sharkID = POINT_TO_SHARK_ID.get(pt.id);
    return { sharkID, shark: sharkID ? SHARK_MAP.get(sharkID) : undefined };
}
