import L from "leaflet";


/* Oceans types */

export type OceanMapHandle = {
    dataLayer: L.LayerGroup | null;
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
    label: string;
};

export type OceanViewerMetricsToggleProps = {
    datasetKey: string;
    onDatasetChange: (key: string) => void;
};

