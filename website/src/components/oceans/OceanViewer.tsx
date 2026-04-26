import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import * as d3 from "d3";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import CondensedSharkCard from "../cards/CondensedSharkCard";
import OceanViewerTimeline from "./OceanViewerTimeline";

import { 
    ALL_MONTHS, 
    CHL_SCALE, 
    SHARK_MAP, SHARK_OBS, 
    POINT_TO_SHARK_ID 
} from "../../utils/OceanViewerUtils";

import { ChlorophyllGridPoint } from "../../types/coordinates";


export default function OceanViewer() {
    const mapElRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const chlLayerRef = useRef<L.LayerGroup | null>(null);
    const sharkLayerRef = useRef<L.LayerGroup | null>(null);
    const rendererRef = useRef<L.Canvas | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const [sliderIndex, setSliderIndex] = useState(ALL_MONTHS.length - 1);
    const [yearChlData, setYearChlData] = useState<Record<string, ChlorophyllGridPoint[]>>({});
    const [loadedYear, setLoadedYear] = useState<number | null>(null);
    const [isLoadingCHL, setIsLoadingCHL] = useState(false);

    // Initialize Leaflet map once
    useEffect(() => {
        if (!mapElRef.current || mapRef.current) return;

        const renderer = L.canvas({ padding: 0.5 });
        rendererRef.current = renderer;

        // maxBounds clamps panning to the data coverage area (lat ±40°)
        const dataBounds = L.latLngBounds([-40, -180], [40, 180]);

        const map = L.map(mapElRef.current, {
            center: [0, 0],
            zoom: 2,
            minZoom: 2.3,
            maxZoom: 10,
            attributionControl: false,
            maxBounds: dataBounds,
            maxBoundsViscosity: 1.0,
        });

        // Dark base, no labels
        L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png",
            { maxZoom: 10 }
        ).addTo(map);

        mapRef.current = map;
        chlLayerRef.current = L.layerGroup().addTo(map);
        sharkLayerRef.current = L.layerGroup().addTo(map);

        // Defer size measurement so tiles fill without seams after layout
        setTimeout(() => map.invalidateSize(), 0);

        return () => { map.remove(); mapRef.current = null; };
    }, []);

    // Lazy-load per-year chlorophyll CSV when selected year changes
    useEffect(() => {
        const year = +ALL_MONTHS[sliderIndex].slice(0, 4);
        if (year === loadedYear) return;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsLoadingCHL(true);
        setYearChlData({});

        fetch(`/data/chlorophyll/global_${year}_chlorophyll.csv`, {
            signal: controller.signal,
        })
            .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
            .then((text) => {
                const index: Record<string, ChlorophyllGridPoint[]> = {};
                for (const row of d3.csvParse(text)) {
                    if (!row.mean_CHL || row.mean_CHL === "") continue;
                    const month = row.time.slice(0, 7);
                    if (!index[month]) index[month] = [];
                    index[month].push({
                        lat: +row.latitude,
                        lng: +row.longitude,
                        meanCHL: +row.mean_CHL,
                    });
                }
                setYearChlData(index);
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
        if (!chlLayerRef.current || !sharkLayerRef.current) return;

        const month = ALL_MONTHS[sliderIndex];
        const renderer = rendererRef.current ?? undefined;

        chlLayerRef.current.clearLayers();
        for (const pt of yearChlData[month] ?? []) {
            L.rectangle(
                [[pt.lat, pt.lng], [pt.lat + 1, pt.lng + 1]],
                {
                    renderer,
                    color: "transparent",
                    fillColor: CHL_SCALE(Math.max(0.05, pt.meanCHL)),
                    fillOpacity: 0.75,
                    weight: 0,
                }
            ).addTo(chlLayerRef.current!);
        }

        sharkLayerRef.current.clearLayers();
        for (const pt of SHARK_OBS[month] ?? []) {
            const marker = L.circleMarker([pt.lat, pt.lng], {
                renderer,
                radius: 5,
                color: "#cc4400",
                fillColor: "#ff7700",
                fillOpacity: 0.9,
                weight: 1.5,
            });

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
            } else {
                marker.bindPopup(
                    `<b>Whale Shark</b><br>ID: ${sharkID ?? pt.id}<br>Date: ${pt.date}`
                );
            }

            marker.addTo(sharkLayerRef.current!);
        }
    }, [sliderIndex, yearChlData]);

    return (
        <div className="ocean-viewer">
            <div ref={mapElRef} className="ocean-viewer-map" />

            <OceanViewerTimeline
                sliderIndex={sliderIndex}
                onSliderChange={setSliderIndex}
                currentMonth={ALL_MONTHS[sliderIndex]}
                isLoadingCHL={isLoadingCHL}
            />
        </div>
    );
}

