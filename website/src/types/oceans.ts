import L from "leaflet";


/* Oceans types */

export type OceanMapHandle = {
    chlLayer: L.LayerGroup | null;
    sharkLayer: L.LayerGroup | null;
    renderer: L.Canvas | null;
};

export type OceanDatasetConfig = {
    csvPath: (year: number) => string;
    timeField: string;
    latField: string;
    lngField: string;
    dataFields: Record<string, string>;
    colorScale: (value: number) => string;
    gradientStops: number[];
};
