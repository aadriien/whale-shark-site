import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import * as d3 from "d3";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import CondensedSharkCard from "../cards/CondensedSharkCard";
import { mediaSharks } from "../../utils/DataUtils";

interface ChlPoint {
  latitude: number;
  longitude: number;
  mean_CHL: number;
}

interface SharkObs {
  whaleSharkID: string;
  lat: number;
  lon: number;
  date: string;
}

type MonthKey = string; // "YYYY-MM"

const COORD_RE =
  /lat:([-\d.]+)\s+long:([-\d.]+)\s+\([^)]*?(\d{4}-\d{2}-\d{2})\)/g;

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const CHL_INTERPOLATOR = d3.interpolateRgbBasis([
  "#002a1a",
  "#005533",
  "#00aa44",
  "#44ff22",
  "#ccff00",
]);
const CHL_SCALE = d3.scaleSequentialLog().domain([0.05, 30]).interpolator(CHL_INTERPOLATOR);

function formatMonthKey(key: MonthKey): string {
  const [year, mon] = key.split("-");
  return `${MONTH_LABELS[+mon - 1]} ${year}`;
}

function generateMonths(): MonthKey[] {
  const months: MonthKey[] = [];
  const now = new Date();
  let year = 2015;
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

async function loadSharkData(): Promise<Map<MonthKey, SharkObs[]>> {
  const index = new Map<MonthKey, SharkObs[]>();
  const resp = await fetch("/data/sharks/gbif_individual_sharks_stats.csv");
  const text = await resp.text();

  for (const row of d3.csvParse(text)) {
    const coordStr =
      row["lat:decimalLatitude long:decimalLongitude (eventDate)"] ?? "";
    COORD_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = COORD_RE.exec(coordStr)) !== null) {
      const month = m[3].slice(0, 7);
      if (!index.has(month)) index.set(month, []);
      index.get(month)!.push({
        whaleSharkID: row.whaleSharkID,
        lat: +m[1],
        lon: +m[2],
        date: m[3],
      });
    }
  }
  return index;
}

export default function OceanViewer() {
  const mapElRef    = useRef<HTMLDivElement>(null);
  const mapRef      = useRef<L.Map | null>(null);
  const chlLayerRef = useRef<L.LayerGroup | null>(null);
  const sharkLayerRef = useRef<L.LayerGroup | null>(null);
  const rendererRef = useRef<L.Canvas | null>(null);
  const abortRef    = useRef<AbortController | null>(null);

  const [sliderIdx, setSliderIdx] = useState(ALL_MONTHS.length - 1);
  const [sharkData, setSharkData] = useState<Map<MonthKey, SharkObs[]>>(new Map());
  const [yearChlData, setYearChlData] = useState<Map<MonthKey, ChlPoint[]>>(new Map());
  const [loadedYear, setLoadedYear]   = useState<number | null>(null);
  const [chlLoading, setChlLoading]   = useState(false);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;

    const renderer = L.canvas({ padding: 0.5 });
    rendererRef.current = renderer;

    // Data covers lat ±40°, lon ±180° — hard-clamp map to that range.
    // fitBounds is unreliable before the container has layout; use whenReady instead.
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

    // Dark base, no labels — continents are solid black
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png",
      { maxZoom: 10 }
    ).addTo(map);

    mapRef.current    = map;
    chlLayerRef.current   = L.layerGroup().addTo(map);
    sharkLayerRef.current = L.layerGroup().addTo(map);

    // Re-measure the container after layout so tiles fill without seams
    setTimeout(() => map.invalidateSize(), 0);

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Load shark data once
  useEffect(() => {
    loadSharkData().then(setSharkData);
  }, []);

  // Load the per-year global chlorophyll CSV when the year changes
  useEffect(() => {
    const year = +ALL_MONTHS[sliderIdx].slice(0, 4);
    if (year === loadedYear) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setChlLoading(true);
    setYearChlData(new Map());

    fetch(`/data/chlorophyll/global_${year}_chlorophyll.csv`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((text) => {
        const index = new Map<MonthKey, ChlPoint[]>();
        for (const row of d3.csvParse(text)) {
          if (!row.mean_CHL || row.mean_CHL === "") continue;
          const month = row.time.slice(0, 7);
          if (!index.has(month)) index.set(month, []);
          index.get(month)!.push({
            latitude: +row.latitude,
            longitude: +row.longitude,
            mean_CHL: +row.mean_CHL,
          });
        }
        setYearChlData(index);
        setLoadedYear(year);
        setChlLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setYearChlData(new Map()); // 404 or error — render nothing, don't retry
          setLoadedYear(year);
          setChlLoading(false);
        }
      });
  }, [sliderIdx, loadedYear]);

  // Re-render map layers whenever month or data changes
  useEffect(() => {
    if (!chlLayerRef.current || !sharkLayerRef.current) return;

    const month    = ALL_MONTHS[sliderIdx];
    const renderer = rendererRef.current ?? undefined;

    chlLayerRef.current.clearLayers();
    for (const pt of yearChlData.get(month) ?? []) {
      L.rectangle(
        [[pt.latitude, pt.longitude], [pt.latitude + 1, pt.longitude + 1]],
        {
          renderer,
          color: "transparent",
          fillColor: CHL_SCALE(Math.max(0.05, pt.mean_CHL)),
          fillOpacity: 0.75,
          weight: 0,
        }
      ).addTo(chlLayerRef.current!);
    }

    sharkLayerRef.current.clearLayers();
    for (const shark of sharkData.get(month) ?? []) {
      const marker = L.circleMarker([shark.lat, shark.lon], {
        renderer,
        radius: 5,
        color: "#cc4400",
        fillColor: "#ff7700",
        fillOpacity: 0.9,
        weight: 1.5,
      });

      const found = SHARK_MAP.get(shark.whaleSharkID);
      if (found) {
        const container = document.createElement("div");
        container.style.width = "230px";
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
          `<b>Whale Shark</b><br>ID: ${shark.whaleSharkID}<br>Date: ${shark.date}`
        );
      }

      marker.addTo(sharkLayerRef.current!);
    }
  }, [sliderIdx, yearChlData, sharkData]);

  const currentMonth = ALL_MONTHS[sliderIdx];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "90%", }}>
      <style>{`
        .shark-card-popup .leaflet-popup-content-wrapper { padding: 0; border-radius: 8px; overflow: hidden; }
        .shark-card-popup .leaflet-popup-content { margin: 0 !important; width: auto !important; }
        .shark-card-popup .condensed-shark-card { border-radius: 8px; }
        .shark-card-popup .condensed-shark-card p { margin: 0 !important; }
      `}</style>
      <div
        ref={mapElRef}
        style={{ width: "100%", height: 500, borderRadius: 8, overflow: "hidden" }}
      />

      <div style={{ padding: "0 4px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 16 }}>
            {formatMonthKey(currentMonth)}
          </span>
          {chlLoading && (
            <span style={{ fontSize: 12, color: "#888" }}>loading chlorophyll…</span>
          )}
        </div>

        <input
          type="range"
          min={0}
          max={ALL_MONTHS.length - 1}
          value={sliderIdx}
          onChange={(e) => setSliderIdx(+e.target.value)}
          style={{ width: "100%", cursor: "pointer" }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "#888",
            marginTop: 2,
          }}
        >
          <span>{ALL_MONTHS[0]}</span>
          <span>{ALL_MONTHS[ALL_MONTHS.length - 1]}</span>
        </div>

        <div
          style={{
            marginTop: 14,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#888", minWidth: 180 }}>
              Chlorophyll (mg/m³)
            </span>
            <div
              style={{
                width: 140,
                height: 12,
                borderRadius: 2,
                background: `linear-gradient(to right, ${[0.05, 0.2, 0.7, 3, 12, 30]
                  .map((v) => CHL_SCALE(v))
                  .join(", ")})`,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: 60,
                fontSize: 11,
                color: "#888",
              }}
            >
              <span>low</span>
              <span>high</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width={12} height={12} viewBox="0 0 12 12">
              <circle
                cx={6} cy={6} r={5}
                fill="#ff7700" stroke="#cc4400" strokeWidth={1.5}
              />
            </svg>
            <span style={{ fontSize: 12, color: "#888" }}>Whale shark observation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
