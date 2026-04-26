import * as d3 from "d3";

import { mediaSharks, MONTHS } from "./DataUtils";
import { getSharkCoordinates } from "./CoordinateUtils";

import { PlottedCoordinatePoint } from "../types/coordinates";


// Chlorophyll scale
const CHL_INTERPOLATOR = d3.interpolateRgbBasis([
    "#002a1a",
    "#005533",
    "#00aa44",
    "#44ff22",
    "#ccff00",
]);

export const CHL_SCALE = d3.scaleSequentialLog().domain([0.05, 30]).interpolator(CHL_INTERPOLATOR);

export const CHL_GRADIENT = {
    background: `linear-gradient(to right, ${[0.05, 0.2, 0.7, 3, 12, 30].map((v) => CHL_SCALE(v)).join(", ")})`,
};


// Month viewer display
function generateMonths(): string[] {
    const months: string[] = [];
    const now = new Date();

    let year = 2000;
    let month = 1;

    while (
        year < now.getFullYear() ||
        (year === now.getFullYear() && month <= now.getMonth() + 1)
    ) {
        months.push(`${year}-${String(month).padStart(2, "0")}`);
        month++;
        if (month > 12) { month = 1; year++; }
    }
    return months;
}

export function formatMonthKey(key: string): string {
    const [year, mon] = key.split("-");
    return `${MONTHS[+mon - 1]} ${year}`;
}

export const ALL_MONTHS = generateMonths();


// Shark observation index
export const SHARK_MAP = new Map(mediaSharks.map((s) => [s.id, s]));

// pt.id is "${sharkID}-${lat}-${lng}" 
// Reverse lookup lets the render find shark without repeated search
export const POINT_TO_SHARK_ID = new Map<string, string>();

function buildSharkIndex(): Record<string, PlottedCoordinatePoint[]> {
    const index: Record<string, PlottedCoordinatePoint[]> = {};
    for (const sharkID of SHARK_MAP.keys()) {
        for (const pt of getSharkCoordinates(sharkID)) {
            if (!pt.date) continue;
            const month = pt.date.slice(0, 7);
            if (!index[month]) index[month] = [];
            index[month].push(pt);
            POINT_TO_SHARK_ID.set(pt.id, sharkID);
        }
    }
    return index;
}

export const SHARK_OBS = buildSharkIndex();

