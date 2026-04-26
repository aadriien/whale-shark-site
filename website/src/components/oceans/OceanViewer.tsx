import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import L from "leaflet";

import CondensedSharkCard from "../cards/CondensedSharkCard";
import OceanViewerMap from "./OceanViewerMap";
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
    const [yearChlData, setYearChlData] = useState<Record<string, OceanGridPoint[]>>({});
    const [loadedYear, setLoadedYear] = useState<number | null>(null);
    const [isLoadingCHL, setIsLoadingCHL] = useState(false);

    // Lazy-load per-year dataset CSV when selected year or dataset changes
    useEffect(() => {
        const year = +ALL_MONTHS[sliderIndex].slice(0, 4);
        if (year === loadedYear) return;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsLoadingCHL(true);
        setYearChlData({});

        processOceanDataset(datasetToProcess, year, controller.signal)
            .then((data) => {
                setYearChlData(data);
                setLoadedYear(year);
                setIsLoadingCHL(false);
            })
            .catch((err) => {
                if (err.name !== "AbortError") {
                    setYearChlData({}); // 404 / error — show nothing, don't retry
                    setLoadedYear(year);
                    setIsLoadingCHL(false);
                }
            });
    }, [sliderIndex, loadedYear]);

    // Re-render map layers when month or chlorophyll data changes
    useEffect(() => {
        const { chlLayer, sharkLayer, renderer } = mapHandleRef.current ?? {};
        if (!chlLayer || !sharkLayer) return;

        const month = ALL_MONTHS[sliderIndex];
        const leafletRenderer = renderer ?? undefined;

        chlLayer.clearLayers();
        for (const pt of yearChlData[month] ?? []) {
            L.rectangle(
                [[pt.lat, pt.lng], [pt.lat + 1, pt.lng + 1]],
                {
                    renderer: leafletRenderer,
                    color: "transparent",
                    fillColor: OCEAN_DATASETS[datasetToProcess].colorScale(Math.max(0.05, pt.meanCHL || 0.05)),
                    fillOpacity: 0.75,
                    weight: 0,
                }
            ).addTo(chlLayer);
        }

        sharkLayer.clearLayers();
        for (const pt of SHARK_OBS[month] ?? []) {
            const marker = L.circleMarker([pt.lat, pt.lng], {
                renderer: leafletRenderer,
                radius: 5,
                color: "#cc4400",
                fillColor: "#ff7700",
                fillOpacity: 0.9,
                weight: 1.5,
            });

            bindSharkPopup(marker, pt);
            marker.addTo(sharkLayer);
        }
    }, [sliderIndex, yearChlData]);

    return (
        <div className="ocean-viewer">
            <OceanViewerMap ref={mapHandleRef} />

            <OceanViewerTimeline
                sliderIndex={sliderIndex}
                onSliderChange={setSliderIndex}
                currentMonth={ALL_MONTHS[sliderIndex]}
                isLoadingCHL={isLoadingCHL}
            />
        </div>
    );
}

