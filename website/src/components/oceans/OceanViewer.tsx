import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot, Root } from "react-dom/client";

import maplibregl from "maplibre-gl";

import CondensedSharkCard from "../cards/CondensedSharkCard";
import OceanViewerMap from "./OceanViewerMap";
import OceanViewerMetricsToggle from "./OceanViewerMetricsToggle";
import OceanViewerTimeline from "./OceanViewerTimeline";

import {
    ALL_MONTHS,
    OCEAN_DATASETS,
    SHARK_OBS,
    processOceanDataset,
} from "../../utils/OceanViewerUtils";

import {
    clusterSharkObservations,
    createSharkMarkerEl,
    getClusterRadius,
    getSharkIDForPoint,
} from "../../utils/OceanViewerSharkMarkers";

import type { FeatureCollection } from "geojson";

import { OceanGridPoint } from "../../types/coordinates";
import { OceanMapHandle } from "../../types/oceans";
import { PlottedCoordinatePoint } from "../../types/coordinates";

const DATA_SOURCE_ID = "ocean-data";
const DATA_LAYER_ID = "ocean-data-fill";

function buildGridGeoJSON(
    points: OceanGridPoint[],
    dataField: string,
    colorScale: (value: number) => string,
    scaleDomainMin: number
): FeatureCollection {
    return {
        type: "FeatureCollection",
        features: points.map((pt) => ({
            type: "Feature" as const,
            properties: {
                color: colorScale(
                    Math.max(scaleDomainMin, (pt[dataField] as number) || scaleDomainMin)
                ),
            },
            geometry: {
                type: "Polygon" as const,
                coordinates: [
                    [
                        [pt.lng, pt.lat],
                        [pt.lng + 1, pt.lat],
                        [pt.lng + 1, pt.lat + 1],
                        [pt.lng, pt.lat + 1],
                        [pt.lng, pt.lat],
                    ],
                ],
            },
        })),
    };
}

function createSharkPopup(pt: PlottedCoordinatePoint): maplibregl.Popup {
    const { sharkID, shark } = getSharkIDForPoint(pt);

    const container = document.createElement("div");
    container.className = "shark-card-popup-container";

    const popup = new maplibregl.Popup({
        maxWidth: "230px",
        className: "shark-card-popup",
    }).setDOMContent(container);

    let root: Root | null = null;

    if (shark) {
        root = createRoot(container);
        root.render(<CondensedSharkCard shark={shark} />);
    } else {
        container.innerHTML = `<b>Whale Shark</b><br>ID: ${sharkID ?? pt.id}<br>Date: ${pt.date}`;
    }

    popup.on("close", () => root?.unmount());
    return popup;
}

export default function OceanViewer() {
    const mapHandleRef = useRef<OceanMapHandle>(null);
    const abortRef = useRef<AbortController | null>(null);
    const sharkMarkersRef = useRef<maplibregl.Marker[]>([]);

    const [datasetToProcess, setDatasetToProcess] =
        useState<keyof typeof OCEAN_DATASETS>("chlorophyll");

    const [sliderIndex, setSliderIndex] = useState(ALL_MONTHS.length - 1);
    const [yearDataset, setYearGridData] = useState<Record<string, OceanGridPoint[]>>({});
    const [loadedYear, setLoadedYear] = useState<number | null>(null);
    
    const [isLoadingDataset, setIsLoadingDataset] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const [zoom, setZoom] = useState(1.5);

    // Reset cache when metric changes so load effect re-fetches new dataset
    useEffect(() => {
        setLoadedYear(null);
        setYearGridData({});
    }, [datasetToProcess]);

    const handleZoom = useCallback(() => {
        const map = mapHandleRef.current?.map;
        if (map) setZoom(map.getZoom());
    }, []);

    useEffect(() => {
        const map = mapHandleRef.current?.map;
        if (!map || !mapReady) return;
        map.on("zoomend", handleZoom);
        return () => { map.off("zoomend", handleZoom); };
    }, [mapReady, handleZoom]);

    // Lazy-load per-year dataset CSV when selected year or dataset changes
    useEffect(() => {
        const year = +ALL_MONTHS[sliderIndex].slice(0, 4);
        if (year === loadedYear) return;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsLoadingDataset(true);
        setYearGridData({});

        processOceanDataset(datasetToProcess, year, controller.signal)
            .then((data) => {
                setYearGridData(data);
                setLoadedYear(year);
                setIsLoadingDataset(false);
            })
            .catch((err) => {
                if (err.name !== "AbortError") {
                    setYearGridData({}); // 404 / error: show nothing, don't retry
                    setLoadedYear(year);
                    setIsLoadingDataset(false);
                }
            });
    }, [sliderIndex, loadedYear, datasetToProcess]);

    // Update ocean grid data layer to reflect latest selections
    useEffect(() => {
        const map = mapHandleRef.current?.map;
        if (!map || !mapReady) return;

        const month = ALL_MONTHS[sliderIndex];
        const datasetConfig = OCEAN_DATASETS[datasetToProcess];
        
        const primaryDataField = Object.keys(datasetConfig.dataFields)[0];
        const scaleDomainMin = datasetConfig.colorScale.domain()[0];

        const geojson = buildGridGeoJSON(
            yearDataset[month] ?? [],
            primaryDataField,
            datasetConfig.colorScale,
            scaleDomainMin
        );

        const source = map.getSource(DATA_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
        if (source) {
            source.setData(geojson);
        } else {
            map.addSource(DATA_SOURCE_ID, { type: "geojson", data: geojson });
            map.addLayer({
                id: DATA_LAYER_ID,
                type: "fill",
                source: DATA_SOURCE_ID,
                paint: {
                    "fill-color": ["get", "color"],
                    "fill-opacity": 0.75,
                    "fill-antialias": false,
                },
            });
        }
    }, [sliderIndex, yearDataset, datasetToProcess, mapReady]);

    // Render shark markers (re-clusters on zoom change)
    useEffect(() => {
        const map = mapHandleRef.current?.map;
        if (!map || !mapReady) return;

        for (const m of sharkMarkersRef.current) m.remove();
        sharkMarkersRef.current = [];

        const month = ALL_MONTHS[sliderIndex];
        const rawPoints = SHARK_OBS[month] ?? [];
        if (rawPoints.length === 0) return;

        const datasetConfig = OCEAN_DATASETS[datasetToProcess];
        const radiusDeg = getClusterRadius(zoom);
        const clustered = clusterSharkObservations(rawPoints, radiusDeg);

        for (const obs of clustered) {
            const el = createSharkMarkerEl(datasetConfig.sharkColor, obs.count, zoom);
            const popup = createSharkPopup(obs.pt);

            const marker = new maplibregl.Marker({
                element: el,
                anchor: "center",
            })
                .setLngLat([obs.lng, obs.lat])
                .setPopup(popup)
                .addTo(map);

            sharkMarkersRef.current.push(marker);
        }
    }, [sliderIndex, datasetToProcess, mapReady, zoom]);

    return (
        <div className="ocean-viewer">
            <div className="ocean-viewer-map-container">
                <OceanViewerMap ref={mapHandleRef} onLoad={() => setMapReady(true)} />
                <OceanViewerMetricsToggle
                    datasetKey={datasetToProcess}
                    onDatasetChange={(key) =>
                        setDatasetToProcess(key as keyof typeof OCEAN_DATASETS)
                    }
                />
            </div>

            <OceanViewerTimeline
                sliderIndex={sliderIndex}
                onSliderChange={setSliderIndex}
                currentMonth={ALL_MONTHS[sliderIndex]}
                isLoadingDataset={isLoadingDataset}
                datasetKey={datasetToProcess}
            />
        </div>
    );
}