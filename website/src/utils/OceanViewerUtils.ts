import * as d3 from "d3";

import { mediaSharks, MONTHS } from "./DataUtils";
import { getSharkCoordinates } from "./CoordinateUtils";

import { PlottedCoordinatePoint, OceanGridPoint } from "../types/coordinates";
import { OceanDatasetConfig } from "../types/oceans";


const SHARK_MARKER_PATH = "M 4,28 C 4,20 8,12 18,10 C 24,9 30,10 44,10 C 48,5 52,2 55,2 C 58,2 62,7 62,13 C 64,13 74,15 82,20 C 88,14 96,7 94,10 C 92,16 89,23 86,28 C 88,33 96,40 94,40 C 92,38 82,32 60,36 C 48,38 34,40 18,38 C 8,36 4,34 4,28 Z M 10,26 a 1.5,1.5 0 1 0 3,0 a 1.5,1.5 0 1 0 -3,0";

export const SHARK_MARKER_SIZE: [number, number] = [40, 18];

export function sharkMarkerHtml(color: string): string {
    const [w, h] = SHARK_MARKER_SIZE;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 46" width="${w}" height="${h}"><path fill="${color}" stroke="black" stroke-width="4" fill-rule="evenodd" d="${SHARK_MARKER_PATH}"/></svg>`;
}


// Chlorophyll scale (logarithmic, mg/m³)
const CHL_INTERPOLATOR = d3.interpolateRgbBasis([
    "#002a1a",
    "#005533",
    "#00aa44",
    "#44ff22",
    "#ccff00",
]);
export const CHL_SCALE = d3.scaleSequentialLog().domain([0.05, 30]).interpolator(CHL_INTERPOLATOR);

// Sea surface temperature scale (linear, °C)
const SST_INTERPOLATOR = d3.interpolateRgbBasis([
    "#0a1f6e",
    "#0077b6",
    "#00b4d8",
    "#90e0ef",
    "#ffffcc",
    "#fdae61",
    "#f46d43",
    "#d73027",
]);
export const SST_SCALE = d3.scaleSequential().domain([0, 35]).interpolator(SST_INTERPOLATOR);

export const OCEAN_DATASETS = {
    chlorophyll: {
        csvPath: (year: number) => `/data/chlorophyll/global_${year}_chlorophyll.csv`,
        timeField: "time",
        latField: "latitude",
        lngField: "longitude",
        dataFields: { meanCHL: "mean_CHL" },
        colorScale: CHL_SCALE,
        gradientStops: [0.05, 0.2, 0.7, 3, 12, 30],
        label: "Chlorophyll (mg/m³)",
        sharkColor: "#ff7700",
    },
    temperature: {
        csvPath: (year: number) => `/data/temperature/global_${year}_temperature.csv`,
        timeField: "time",
        latField: "latitude",
        lngField: "longitude",
        dataFields: { meanSST: "mean_analysed_sst" },
        colorScale: SST_SCALE,
        gradientStops: [0, 5, 15, 22, 28, 35],
        label: "Sea Surface Temperature (°C)",
        sharkColor: "#39ff14",
    },
} satisfies Record<string, OceanDatasetConfig>;


// Month viewer display
function generateMonths(): string[] {
    const months: string[] = [];
    const now = new Date();

    let year = 2000;
    let month = 1;

    while (year < now.getFullYear()) {
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


// Fetch & parse Copernicus Marine dataset 
export async function fetchOceanCSV(
    datasetKey: keyof typeof OCEAN_DATASETS,
    year: number,
    signal: AbortSignal,
): Promise<string> {
    const { csvPath } = OCEAN_DATASETS[datasetKey];
    const r = await fetch(csvPath(year), { signal });

    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.text();
}

export function parseOceanCSV(
    text: string,
    config: OceanDatasetConfig,
): Record<string, OceanGridPoint[]> {
    // Extract info from dataset to build out grid points for the map
    const index: Record<string, OceanGridPoint[]> = {};

    for (const row of d3.csvParse(text)) {
        const timeVal = row[config.timeField];
        const latVal = row[config.latField];
        const lngVal = row[config.lngField];

        if (!timeVal || !latVal || !lngVal) continue;

        const hasData = Object.values(config.dataFields).some(
            (col) => row[col] && row[col] !== ""
        );
        if (!hasData) continue;

        const month = timeVal.slice(0, 7);
        if (!index[month]) index[month] = [];

        const point: OceanGridPoint = { lat: +latVal, lng: +lngVal };
        for (const [outputField, csvCol] of Object.entries(config.dataFields)) {
            const val = row[csvCol];
            if (val && val !== "") point[outputField] = +val;
        }
        index[month].push(point);
    }
    return index;
}

export async function processOceanDataset(
    datasetKey: keyof typeof OCEAN_DATASETS,
    year: number,
    signal: AbortSignal,
): Promise<Record<string, OceanGridPoint[]>> {
    // Identify the relevant dataset, then extract values
    const config = OCEAN_DATASETS[datasetKey];
    const text = await fetchOceanCSV(datasetKey, year, signal);
    return parseOceanCSV(text, config);
}

