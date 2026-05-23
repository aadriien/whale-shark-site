import React from "react";

import * as THREE from "three";
import ThreeGlobe from "three-globe";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import JEASINGS, { JEasing, Cubic } from "./JEasings/JEasings";

import { getSharkCoordinates } from "./CoordinateUtils";

import { PlottedCoordinatePoint } from "../types/coordinates";

import earthImg from "../assets/images/three-globe-imgs/earth-blue-marble.jpg";
import bumpImg from "../assets/images/three-globe-imgs/earth-topology.png";

// Named views as lat/lng for ocean/coast areas relevant to whale shark data
// goToCoordinates, yaw, pitch all operate in lat/lng space, so store views same way
const GLOBE_VIEWS = {
    gulfOfGuinea: { lat: 0, lng: 0 }, // Atlantic equator / West Africa
    mozambiqueChannel: { lat: -18, lng: 38 }, // East Africa coast
    westernIndianOcean: { lat: -10, lng: 45 }, // Tanzania / Kenya
    arabianSea: { lat: 12, lng: 50 }, // Horn of Africa
    ningalooReef: { lat: -22, lng: 113 }, // W. Australia
    bayOfBengal: { lat: 8, lng: 80 }, // Sri Lanka
    coralTriangle: { lat: 5, lng: 120 }, // Philippines / Indonesia
    gulfOfMexico: { lat: 20, lng: -87 }, // Caribbean
    bajaCalifornia: { lat: 24, lng: -110 }, // Sea of Cortez
    galapagos: { lat: 0, lng: -90 }, // Eastern Pacific
} as const;

const DEFAULT_VIEW = GLOBE_VIEWS.coralTriangle;

// Camera sits along local Z-axis of pitch rig so yaw/pitch rotations map
// cleanly to lng/lat. Zoom is purely radial (changing z)
const RESTING_DISTANCE = 200;

export function createGlobe() {
    const globe = new ThreeGlobe().globeImageUrl(earthImg).bumpImageUrl(bumpImg);

    globe.scale.set(1, 1, 1);
    globe.visible = true;

    return globe;
}

export function createLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0 * Math.PI);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI);
    directionalLight.position.set(0, 1, 1);

    return { ambientLight, directionalLight };
}

export function createCamera(globeContainer: HTMLDivElement) {
    const camera = new THREE.PerspectiveCamera(
        75,
        globeContainer.clientWidth / globeContainer.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, RESTING_DISTANCE);

    return camera;
}

export function createControls(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    const controls = new OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.rotateSpeed = 0.5;

    controls.enableZoom = true;
    controls.autoRotate = false;

    controls.minDistance = 125;
    controls.maxDistance = 220;

    return controls;
}

export function setupCameraAngles(
    scene: THREE.Scene<THREE.Object3DEventMap>,
    camera: THREE.PerspectiveCamera
) {
    // Euler angles for managing globe storytelling
    const pivot = new THREE.Object3D(); // point around which globe rotates
    const yaw = new THREE.Object3D(); // y-axis (vertical), turn left/right
    const pitch = new THREE.Object3D(); // x-axis (horizontal), tilt up/down

    scene.add(pivot);
    pivot.add(yaw);
    yaw.add(pitch);
    pitch.add(camera);

    // Seed orientation from DEFAULT_VIEW so rig opens facing the right region
    yaw.rotation.y = (DEFAULT_VIEW.lng / 180) * Math.PI;
    pitch.rotation.x = -(DEFAULT_VIEW.lat / 180) * Math.PI;

    return { pivot, yaw, pitch };
}

// Color Interpolator for ring effects
export function colorInterpolator(t: number) {
    // Yellow (255, 255, 0) -> Neon Cyan (0, 255, 255) transition
    const r = Math.round(255 - t * 255); // Transition from yellow to red
    const g = Math.round(255); // Keep green constant (255)
    const b = Math.round(t * 255); // Transition from no blue to full cyan
    return `rgba(${r}, ${g}, ${b}, ${0.9 + (1 - t) * 0.1})`; // Hold opacity
}

export function addRingsData(globe: ThreeGlobe, pointsData: PlottedCoordinatePoint[]) {
    if (!globe) return;

    // Setting up the points (rings) based on "pointsData"
    globe
        .ringsData(pointsData)
        .ringColor(() => colorInterpolator)
        .ringMaxRadius("ringMaxSize")
        .ringPropagationSpeed("ringPropagationSpeed")

        // Repeat period variable (randomized delay in data)
        .ringRepeatPeriod("ringRepeatPeriod");
}

export function addRingsDataStatic(globe: ThreeGlobe, pointsData: PlottedCoordinatePoint[]) {
    if (!globe) return;

    globe
        .ringsData(pointsData)
        // Ring color static since no movement
        .ringColor(() => "rgba(230, 255, 50, 0.9)")

        // Smaller radius & zero movement
        .ringMaxRadius(0.5)
        .ringPropagationSpeed(0)
        .ringRepeatPeriod(0);
}

export function clearRingsData(globe: ThreeGlobe) {
    if (!globe) return;

    // Clear all rings by passing empty data
    globe.ringsData([]);
}

export function addPointsData(globe: ThreeGlobe, pointsData: PlottedCoordinatePoint[]) {
    if (!globe) return;

    globe
        .pointsData(pointsData)
        .pointColor(() => "rgba(255, 255, 0, 0.8)")
        .pointRadius(0.3)
        .pointResolution(6)
        .pointAltitude(0.02);
}

export function clearPointsData(globe: ThreeGlobe) {
    if (!globe) return;
    globe.pointsData([]);
}

export function clearAllData(globe: ThreeGlobe) {
    if (!globe) return;
    globe.ringsData([]);
    globe.pointsData([]);
}

const ROTATION_EPSILON = 0.001; // ~0.057 degrees, imperceptible
const POSITION_EPSILON = 0.5;

// Camera is always along local Z-axis of the pitch rig, so zoom is purely radial
function scaledViewPosition(distance: number) {
    return { x: 0, y: 0, z: distance };
}

export async function resetGlobe(
    camera: THREE.PerspectiveCamera,
    pitchRef: React.RefObject<THREE.Object3D<THREE.Object3DEventMap> | null>
) {
    const cameraAtTarget = Math.abs(camera.position.length() - RESTING_DISTANCE) < POSITION_EPSILON;
    const pitchAtEquator =
        Math.abs(pitchRef.current!.rotation.x) < ROTATION_EPSILON &&
        Math.abs(pitchRef.current!.rotation.y) < ROTATION_EPSILON &&
        Math.abs(pitchRef.current!.rotation.z) < ROTATION_EPSILON;

    if (!cameraAtTarget) {
        // Zoom out along default view axis, then settle back (yaw is NOT reset)
        // Note that goToCoordinates spins directly to target
        new JEasing(camera.position)
            .to(scaledViewPosition(RESTING_DISTANCE * 1.5), 1000)
            .easing(Cubic.InOut)
            .start();
        new JEasing(camera.position)
            .to({ x: 0, y: 0, z: RESTING_DISTANCE }, 1075)
            .easing(Cubic.InOut)
            .start();
    }

    if (!pitchAtEquator) {
        // Level pitch to equator so yaw rotation doesn't arc when near poles
        new JEasing(pitchRef.current!.rotation)
            .to({ x: 0, y: 0, z: 0 }, 1025)
            .easing(Cubic.InOut)
            .start();
    }

    JEASINGS.update();
}

// Returns yaw target that takes the shortest arc from currentY to targetLng,
// avoiding the long way around when crossing globe's international date line
function computeShortestYaw(currentY: number, targetLng: number): number {
    const targetAbsolute = (targetLng / 180) * Math.PI;
    let delta = targetAbsolute - currentY;

    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    return currentY + delta;
}

// Ease camera view to coords point for globe storytelling
export function goToCoordinates(
    lat: number,
    lng: number,
    pitchRef: React.RefObject<THREE.Object3D<THREE.Object3DEventMap> | null>,
    yawRef: React.RefObject<THREE.Object3D<THREE.Object3DEventMap> | null>
) {
    // Animate via shortest arc to avoid spinning the long way around
    const targetPitch = (lat / 180) * Math.PI * -1;
    const targetYaw = computeShortestYaw(yawRef.current!.rotation.y, lng);

    if (Math.abs(pitchRef.current!.rotation.x - targetPitch) >= ROTATION_EPSILON) {
        // Take converted latitude (radians), & animate over 1000 ms (1 sec)
        new JEasing(pitchRef.current!.rotation)
            .to({ x: targetPitch }, 1000)
            .easing(Cubic.InOut)
            .start();
    }

    if (Math.abs(targetYaw - yawRef.current!.rotation.y) >= ROTATION_EPSILON) {
        // Take converted longitude (radians), & animate over 1000 ms (1 sec)
        new JEasing(yawRef.current!.rotation)
            .to({ y: targetYaw }, 1000)
            .easing(Cubic.InOut)
            .start();
    }
}

export async function playStoryMode(
    globe: ThreeGlobe,
    controls: OrbitControls,
    camera: THREE.PerspectiveCamera,
    pitchRef: React.RefObject<THREE.Object3D<THREE.Object3DEventMap> | null>,
    yawRef: React.RefObject<THREE.Object3D<THREE.Object3DEventMap> | null>,
    sharkID: string,
    onPointChange?: (point: PlottedCoordinatePoint) => void
) {
    const sortedPointsData = getSharkCoordinates(sharkID);
    if (!globe || !sortedPointsData.length) return;

    // Zoom in along default view axis (75% of resting distance), over 2.5 sec
    new JEasing(camera.position)
        .to(scaledViewPosition(RESTING_DISTANCE * 0.75), 2500)
        .easing(Cubic.InOut)
        .start();

    console.log(`Playing story for shark ID: ${sharkID}`);

    for (let i = 0; i < sortedPointsData.length; i++) {
        const point = sortedPointsData[i];
        console.log(point);

        goToCoordinates(point.lat, point.lng, pitchRef, yawRef);

        // Wait 2 sec after zoom in before starting story
        if (i == 0) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        // Show ripple for this current singular point
        addRingsData(globe, [point]);

        // Align text display of coords (+ timestamp) with ripple plotting
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (onPointChange) {
            onPointChange(point);
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    // Clear final ripple & restore orbit controls after story told
    setTimeout(() => {
        clearAllData(globe);
        controls.enabled = true;
    }, 1000);
}

export async function highlightSharkMode(
    globe: ThreeGlobe,
    controls: OrbitControls,
    camera: THREE.PerspectiveCamera,
    pitchRef: React.RefObject<THREE.Object3D<THREE.Object3DEventMap> | null>,
    yawRef: React.RefObject<THREE.Object3D<THREE.Object3DEventMap> | null>,
    sharkID: string,
    usePoints: boolean = false,
    keepControlsDisabled: boolean = false
) {
    const sortedPointsData = getSharkCoordinates(sharkID);
    if (!globe || !sortedPointsData.length) return;

    // Zoom in along default view axis (75% of resting distance), over 2.5 sec
    new JEasing(camera.position)
        .to(scaledViewPosition(RESTING_DISTANCE * 0.75), 2500)
        .easing(Cubic.InOut)
        .start();

    console.log(`Highlighting shark ID: ${sharkID} with ${usePoints ? "points" : "ripples"}`);

    // Show either points or ripples for this whale shark
    if (usePoints) {
        addPointsData(globe, sortedPointsData);
    } else {
        addRingsData(globe, sortedPointsData);
    }

    const point = sortedPointsData[0];
    goToCoordinates(point.lat, point.lng, pitchRef, yawRef);

    // Only restore orbit controls if not requested to keep them disabled
    if (!keepControlsDisabled) {
        setTimeout(() => {
            controls.enabled = true;
        }, 2500);
    }
}
