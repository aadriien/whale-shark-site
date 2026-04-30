import { useEffect, useRef } from "react";
import { forwardRef, useImperativeHandle } from "react";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { OceanMapHandle } from "../../types/oceans";


// Weird TypeScript ForwardRef rules when ordering for type inference
// Always props first ({}), then ref second (OceanMapHandle)
const OceanViewerMap = forwardRef<OceanMapHandle, {}>((_, ref) => {
    const mapElRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const dataLayerRef = useRef<L.LayerGroup | null>(null);
    const sharkLayerRef = useRef<L.LayerGroup | null>(null);
    const rendererRef = useRef<L.Canvas | null>(null);

    useImperativeHandle(ref, () => ({
        get dataLayer() { return dataLayerRef.current; },
        get sharkLayer() { return sharkLayerRef.current; },
        get renderer() { return rendererRef.current; },
    }));

    useEffect(() => {
        if (!mapElRef.current || mapRef.current) return;

        const renderer = L.canvas({ padding: 0.5 });
        rendererRef.current = renderer;

        // maxBounds clamps panning to the data coverage area (lat ±60°)
        const dataBounds = L.latLngBounds([-60, -180], [60, 180]);

        const map = L.map(mapElRef.current, {
            center: [0, 0],
            zoom: 2,
            minZoom: 2,
            maxZoom: 5,
            zoomSnap: 0.5,
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
        dataLayerRef.current = L.layerGroup().addTo(map);
        sharkLayerRef.current = L.layerGroup().addTo(map);

        // Recompute minZoom and re-fit whenever the container resizes.
        // At zoom z the world is 256 * 2^z px wide, so the minimum zoom
        // that fills the container without blank edges is log2(width / 256).
        // Padding is subtracted so minZoom stays consistent with border gap.
        const MAP_PADDING = 72;
        const fitToContainer = () => {
            if (!mapElRef.current) return;
            const minZoom = Math.log2((mapElRef.current.clientWidth - MAP_PADDING * 2) / 256);
            map.setMinZoom(minZoom);
            map.fitBounds(dataBounds, { padding: [MAP_PADDING, MAP_PADDING] });
        };

        const observer = new ResizeObserver(fitToContainer);
        observer.observe(mapElRef.current);

        setTimeout(() => {
            map.invalidateSize();
            fitToContainer();
        }, 0);

        return () => { observer.disconnect(); map.remove(); mapRef.current = null; };
    }, []);

    return <div ref={mapElRef} className="ocean-viewer-map" />;
});

export default OceanViewerMap;

