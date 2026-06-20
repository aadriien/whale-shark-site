import maplibregl from "maplibre-gl";

/* Oceans types */

export type OceanMapHandle = {
    map: maplibregl.Map | null;
};

export type OceanDatasetConfig = {
    dataPath: (year: number, month: string) => string;
    latField: string;
    lngField: string;
    dataFields: Record<string, string>;
    colorScale: (value: number) => string;
    gradientStops: number[];
    label: string;
    sharkColor: string;
};

export type OceanViewerMetricsToggleProps = {
    datasetKey: string;
    onDatasetChange: (key: string) => void;
};
