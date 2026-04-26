import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import * as d3 from "d3";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import CondensedSharkCard from "../cards/CondensedSharkCard";
import { mediaSharks, MONTHS } from "../../utils/DataUtils";
import { getSharkCoordinates } from "../../utils/CoordinateUtils";

import { 
    PlottedCoordinatePoint, 
    ChlorophyllGridPoint 
} from "../../types/coordinates";


const CHL_INTERPOLATOR = d3.interpolateRgbBasis([
    "#002a1a",
    "#005533",
    "#00aa44",
    "#44ff22",
    "#ccff00",
]);
const CHL_SCALE = d3.scaleSequentialLog().domain([0.05, 30]).interpolator(CHL_INTERPOLATOR);

function formatMonthKey(key: string): string {
    const [year, mon] = key.split("-");
    return `${MONTHS[+mon - 1]} ${year}`;
}

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

const ALL_MONTHS = generateMonths();

const SHARK_MAP = new Map(mediaSharks.map((s) => [s.id, s]));

// pt.id is "${sharkID}-${lat}-${lng}" — reverse lookup lets the render find the shark without a repeated search
const POINT_TO_SHARK_ID = new Map<string, string>();

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

const SHARK_OBS = buildSharkIndex();


export default function OceanViewer() {
    const mapElRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const chlLayerRef = useRef<L.LayerGroup | null>(null);
    const sharkLayerRef = useRef<L.LayerGroup | null>(null);
    const rendererRef = useRef<L.Canvas | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const [sliderIdx, setSliderIdx] = useState(ALL_MONTHS.length - 1);
    const [yearChlData, setYearChlData] = useState<Record<string, ChlorophyllGridPoint[]>>({});
    const [loadedYear, setLoadedYear] = useState<number | null>(null);
    const [chlLoading, setChlLoading] = useState(false);

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

    // Lazy-load per-year chlorophyll CSV when the selected year changes
    useEffect(() => {
        const year = +ALL_MONTHS[sliderIdx].slice(0, 4);
        if (year === loadedYear) return;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setChlLoading(true);
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
                setChlLoading(false);
            })
            .catch((err) => {
                if (err.name !== "AbortError") {
                    setYearChlData({}); // 404 / error — show nothing, don't retry
                    setLoadedYear(year);
                    setChlLoading(false);
                }
            });
    }, [sliderIdx, loadedYear]);

    // Re-render map layers when month or chlorophyll data changes
    useEffect(() => {
        if (!chlLayerRef.current || !sharkLayerRef.current) return;

        const month = ALL_MONTHS[sliderIdx];
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
    }, [sliderIdx, yearChlData]);

    const currentMonth = ALL_MONTHS[sliderIdx];

    const gradientStyle = {
        background: `linear-gradient(to right, ${[0.05, 0.2, 0.7, 3, 12, 30].map((v) => CHL_SCALE(v)).join(", ")})`,
    };

    return (
        <div className="ocean-viewer">
            <div ref={mapElRef} className="ocean-viewer-map" />

            <div className="ocean-viewer-controls">
                <div className="ocean-viewer-month-header">
                    <span className="ocean-viewer-month-label">
                        {formatMonthKey(currentMonth)}
                    </span>
                    {chlLoading && (
                        <span className="ocean-viewer-loading">loading chlorophyll…</span>
                    )}
                </div>

                <input
                    type="range"
                    min={0}
                    max={ALL_MONTHS.length - 1}
                    value={sliderIdx}
                    onChange={(e) => setSliderIdx(+e.target.value)}
                    className="ocean-viewer-slider"
                />
                <div className="ocean-viewer-slider-bounds">
                    <span>{ALL_MONTHS[0]}</span>
                    <span>{ALL_MONTHS[ALL_MONTHS.length - 1]}</span>
                </div>

                <div className="ocean-viewer-legend">
                    <div className="ocean-viewer-legend-row">
                        <span className="ocean-viewer-legend-label">Chlorophyll (mg/m³)</span>
                        <div className="ocean-viewer-chl-gradient" style={gradientStyle} />
                        <div className="ocean-viewer-legend-range">
                            <span>low</span>
                            <span>high</span>
                        </div>
                    </div>

                    <div className="ocean-viewer-legend-row">
                        <svg width={12} height={12} viewBox="0 0 12 12">
                            <circle cx={6} cy={6} r={5} fill="#ff7700" stroke="#cc4400" strokeWidth={1.5} />
                        </svg>
                        <span className="ocean-viewer-legend-text">Whale shark observation</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
