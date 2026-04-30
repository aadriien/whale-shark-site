import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import L from "leaflet";

import CondensedSharkCard from "../cards/CondensedSharkCard";
import OceanViewerMap from "./OceanViewerMap";
import OceanViewerMetricsToggle from "./OceanViewerMetricsToggle";
import OceanViewerTimeline from "./OceanViewerTimeline";

import {
    ALL_MONTHS,
    OCEAN_DATASETS,
    SHARK_MAP, SHARK_OBS,
    POINT_TO_SHARK_ID,
    processOceanDataset,
} from "../../utils/OceanViewerUtils";

import { OceanGridPoint } from "../../types/coordinates";
import { OceanMapHandle } from "../../types/oceans";
import { PlottedCoordinatePoint } from "../../types/coordinates";


function bindSharkPopup(marker: L.CircleMarker, pt: PlottedCoordinatePoint) {
    const sharkID = POINT_TO_SHARK_ID.get(pt.id);
    const found = sharkID ? SHARK_MAP.get(sharkID) : undefined;

    if (found) {
        const container = document.createElement("div");
        container.className = "shark-card-popup-container";

        const root = createRoot(container);
        root.render(<CondensedSharkCard shark={found} />);

        const popup = L.popup({
            maxWidth: 230,
            minWidth: 230,
            className: "shark-card-popup",
            autoPan: true,
            autoPanPadding: [10, 60],
        }).setContent(container);

        popup.on("remove", () => root.unmount());
        marker.bindPopup(popup);
    } 
    else {
        marker.bindPopup(
            `<b>Whale Shark</b><br>ID: ${sharkID ?? pt.id}<br>Date: ${pt.date}`
        );
    }
}


export default function OceanViewer() {
    const mapHandleRef = useRef<OceanMapHandle>(null);
    const abortRef = useRef<AbortController | null>(null);

    const [datasetToProcess, setDatasetToProcess] = useState<keyof typeof OCEAN_DATASETS>("chlorophyll");
    const [sliderIndex, setSliderIndex] = useState(ALL_MONTHS.length - 1);
    const [yearDataset, setYearGridData] = useState<Record<string, OceanGridPoint[]>>({});
    const [loadedYear, setLoadedYear] = useState<number | null>(null);
    const [isLoadingDataset, setIsLoadingDataset] = useState(false);

    // Reset cache when metric changes so load effect re-fetches new dataset
    useEffect(() => {
        setLoadedYear(null);
        setYearGridData({});
    }, [datasetToProcess]);

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
                    setYearGridData({}); // 404 / error — show nothing, don't retry
                    setLoadedYear(year);
                    setIsLoadingDataset(false);
                }
            });
    }, [sliderIndex, loadedYear]);

    // Re-render map layers when month or chlorophyll data changes
    useEffect(() => {
        const { dataLayer, sharkLayer, renderer } = mapHandleRef.current ?? {};
        if (!dataLayer || !sharkLayer) return;

        const month = ALL_MONTHS[sliderIndex];
        const leafletRenderer = renderer ?? undefined;

        const datasetConfig = OCEAN_DATASETS[datasetToProcess];
        const primaryDataField = Object.keys(datasetConfig.dataFields)[0];
        const scaleDomainMin = datasetConfig.colorScale.domain()[0];

        dataLayer.clearLayers();
        for (const pt of yearDataset[month] ?? []) {
            L.rectangle(
                [[pt.lat, pt.lng], [pt.lat + 1, pt.lng + 1]],
                {
                    renderer: leafletRenderer,
                    color: "transparent",
                    fillColor: datasetConfig.colorScale(Math.max(scaleDomainMin, (pt[primaryDataField] as number) || scaleDomainMin)),
                    fillOpacity: 0.75,
                    weight: 0,
                }
            ).addTo(dataLayer);
        }

        sharkLayer.clearLayers();
        for (const pt of SHARK_OBS[month] ?? []) {
            const marker = L.circleMarker([pt.lat, pt.lng], {
                renderer: leafletRenderer,
                radius: 5,
                color: "#000",
                fillColor: datasetConfig.sharkColor,
                fillOpacity: 0.9,
                weight: 1.5,
            });

            bindSharkPopup(marker, pt);
            marker.addTo(sharkLayer);
        }
    }, [sliderIndex, yearDataset]);

    return (
        <div className="ocean-viewer">
            <div className="ocean-viewer-map-container">
                <OceanViewerMap ref={mapHandleRef} />
                <OceanViewerMetricsToggle
                    datasetKey={datasetToProcess}
                    onDatasetChange={(key) => setDatasetToProcess(key as keyof typeof OCEAN_DATASETS)}
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

