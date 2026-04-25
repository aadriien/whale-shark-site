import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const CHL_REGIONS = [
  "gulf_of_mexico",
  "caribbean_sea",
  "canary_current",
  "guinea_current",
  "agulhas_current",
  "somali_coastal_current",
  "red_sea",
  "arabian_sea",
  "bay_of_bengal",
  "south_china_sea",
  "east_china_sea",
  "coral_triangle",
];

// Log scale: dark teal → vivid green → lime, matches dark-base-map aesthetic
const CHL_INTERPOLATOR = d3.interpolateRgbBasis([
  "#002a1a",
  "#005533",
  "#00aa44",
  "#44ff22",
  "#ccff00",
]);
const CHL_SCALE = d3.scaleSequentialLog().domain([0.05, 30]).interpolator(CHL_INTERPOLATOR);

const COORD_RE =
  /lat:([-\d.]+)\s+long:([-\d.]+)\s+\([^)]*?(\d{4}-\d{2}-\d{2})\)/g;

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatMonthKey(key: MonthKey): string {
  const [year, mon] = key.split("-");
  return `${MONTH_LABELS[+mon - 1]} ${year}`;
}

async function loadChlData(): Promise<Map<MonthKey, ChlPoint[]>> {
  const index = new Map<MonthKey, ChlPoint[]>();

  await Promise.all(
    CHL_REGIONS.map(async (region) => {
      const resp = await fetch(`/data/chlorophyll/${region}_chlorophyll.csv`);
      const text = await resp.text();

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
    })
  );

  return index;
}

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
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const chlLayerRef = useRef<L.LayerGroup | null>(null);
  const sharkLayerRef = useRef<L.LayerGroup | null>(null);

  const [chlData, setChlData] = useState<Map<MonthKey, ChlPoint[]>>(new Map());
  const [sharkData, setSharkData] = useState<Map<MonthKey, SharkObs[]>>(new Map());
  const [months, setMonths] = useState<MonthKey[]>([]);
  const [sliderIdx, setSliderIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;

    const map = L.map(mapElRef.current, {
      center: [10, 70],
      zoom: 2,
      attributionControl: false,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", {
      maxZoom: 10,
    }).addTo(map);

    mapRef.current = map;
    chlLayerRef.current = L.layerGroup().addTo(map);
    sharkLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Load all data once
  useEffect(() => {
    Promise.all([loadChlData(), loadSharkData()]).then(([chl, sharks]) => {
      const allMonths = new Set([...chl.keys(), ...sharks.keys()]);
      const sorted = Array.from(allMonths).sort();
      setChlData(chl);
      setSharkData(sharks);
      setMonths(sorted);
      setSliderIdx(sorted.length - 1);
      setLoading(false);
    });
  }, []);

  // Re-render layers whenever the selected month changes
  useEffect(() => {
    if (!chlLayerRef.current || !sharkLayerRef.current || months.length === 0)
      return;

    const month = months[sliderIdx];
    chlLayerRef.current.clearLayers();
    sharkLayerRef.current.clearLayers();

    for (const pt of chlData.get(month) ?? []) {
      L.rectangle(
        [
          [pt.latitude, pt.longitude],
          [pt.latitude + 1, pt.longitude + 1],
        ],
        {
          color: "transparent",
          fillColor: CHL_SCALE(Math.max(0.05, pt.mean_CHL)),
          fillOpacity: 0.75,
          weight: 0,
        }
      ).addTo(chlLayerRef.current!);
    }

    for (const shark of sharkData.get(month) ?? []) {
      L.circleMarker([shark.lat, shark.lon], {
        radius: 5,
        color: "#cc4400",
        fillColor: "#ff7700",
        fillOpacity: 0.85,
        weight: 1.5,
      })
        .bindPopup(
          `<b>Whale Shark</b><br>ID: ${shark.whaleSharkID}<br>Date: ${shark.date}`
        )
        .addTo(sharkLayerRef.current!);
    }
  }, [sliderIdx, months, chlData, sharkData]);

  const currentMonth = months[sliderIdx] ?? "";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        fontFamily: "sans-serif",
        width: "100%",
        alignSelf: "stretch",
      }}
    >
      <div
        ref={mapElRef}
        style={{ width: "100%", height: 480, borderRadius: 8, overflow: "hidden" }}
      />

      {loading ? (
        <div style={{ padding: "0 8px", color: "#888" }}>
          Loading ocean data…
        </div>
      ) : (
        <div style={{ padding: "0 8px" }}>
          {/* Date label */}
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
            {formatMonthKey(currentMonth)}
          </div>

          {/* Timeline slider */}
          <input
            type="range"
            min={0}
            max={months.length - 1}
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
            <span>{months[0]}</span>
            <span>{months[months.length - 1]}</span>
          </div>

          {/* Legend */}
          <div
            style={{
              marginTop: 14,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#555", minWidth: 160 }}>
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
                  width: 80,
                  fontSize: 11,
                  color: "#888",
                }}
              >
                <span>low</span>
                <span>high</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#555", minWidth: 160 }}>
                Whale shark observation
              </span>
              <svg width={12} height={12} viewBox="0 0 12 12">
                <circle
                  cx={6}
                  cy={6}
                  r={5}
                  fill="#ff7700"
                  stroke="#cc4400"
                  strokeWidth={1.5}
                />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
