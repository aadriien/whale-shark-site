import { useEffect, useRef } from "react";
import { forwardRef, useImperativeHandle } from "react";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { noLabels } from "protomaps-themes-base";

import { OceanMapHandle } from "../../types/oceans";

const PROTOMAPS_API_KEY = import.meta.env.VITE_PROTOMAPS_API_KEY;

type OceanViewerMapProps = { onLoad?: () => void };

const OceanViewerMap = forwardRef<OceanMapHandle, OceanViewerMapProps>(({ onLoad }, ref) => {
    const mapElRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const onLoadRef = useRef(onLoad);
    onLoadRef.current = onLoad;

    useImperativeHandle(ref, () => ({
        get map() {
            return mapRef.current;
        },
    }));

    useEffect(() => {
        if (!mapElRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: mapElRef.current,
            style: {
                version: 8,
                glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
                sources: {
                    protomaps: {
                        type: "vector",
                        url: `https://api.protomaps.com/tiles/v4.json?key=${PROTOMAPS_API_KEY}`,
                        attribution:
                            '<a href="https://protomaps.com">Protomaps</a> · <a href="https://openstreetmap.org">OpenStreetMap</a>',
                    },
                },
                layers: noLabels("protomaps", "dark"),
            },
            center: [0, 0],
            zoom: 1.5,
            minZoom: 1.5,
            maxZoom: 5,
            attributionControl: false,
        });

        mapRef.current = map;

        map.on("load", () => {
            map.resize();
            onLoadRef.current?.();
        });

        const observer = new ResizeObserver(() => {
            map.resize();
        });
        observer.observe(mapElRef.current);

        return () => {
            observer.disconnect();
            map.remove();
            mapRef.current = null;
        };
    }, []);

    return <div ref={mapElRef} className="ocean-viewer-map" />;
});

export default OceanViewerMap;
