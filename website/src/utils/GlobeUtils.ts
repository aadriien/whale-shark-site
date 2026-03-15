import * as THREE from "three";
import ThreeGlobe from "three-globe";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import JEASINGS, { JEasing, Cubic } from "./JEasings/JEasings";

import { getSharkCoordinates } from "./CoordinateUtils";

import { PlottedCoordinatePoint } from "../types/coordinates";

import earthImg from "../assets/images/three-globe-imgs/earth-blue-marble.jpg";
import bumpImg from "../assets/images/three-globe-imgs/earth-topology.png";


export function createGlobe() {
    const globe = new ThreeGlobe()
        .globeImageUrl(earthImg)
        .bumpImageUrl(bumpImg);
  
    // const material = new THREE.MeshStandardMaterial({
    //     roughness: 0.8,
    //     metalness: 0.1,
    // });
  
    // globe.globeMaterial(material);
    globe.scale.set(1, 1, 1);
    globe.visible = true;

    return globe;
};


export function createLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0 * Math.PI);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI);
    directionalLight.position.set(0, 1, 1);

    return { ambientLight, directionalLight };
};


export function createCamera(globeContainer: HTMLDivElement) {
    const camera = new THREE.PerspectiveCamera(
        75,
        globeContainer.clientWidth / globeContainer.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 200);

    return camera;
};


export function createControls(
    camera: THREE.PerspectiveCamera, 
    renderer: THREE.WebGLRenderer
) {
    const controls = new OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.rotateSpeed = 0.5;

    controls.enableZoom = true;
    controls.autoRotate = false;

    controls.minDistance = 125;
    controls.maxDistance = 220;

    return controls;
};
  

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
  
    return { pivot, yaw, pitch };
};

  

// Color Interpolator for ring effects
export function colorInterpolator(t: number) {
    // Yellow (255, 255, 0) -> Neon Cyan (0, 255, 255) transition
    const r = Math.round(255 - t * 255);  // Transition from yellow to red
    const g = Math.round(255);             // Keep green constant (255)
    const b = Math.round(t * 255);        // Transition from no blue to full cyan
    return `rgba(${r}, ${g}, ${b}, ${0.9 + (1 - t) * 0.1})`;  // Hold opacity
};



export function addRingsData(
    globe: ThreeGlobe, 
    pointsData: PlottedCoordinatePoint[]
) {
    if (!globe) return;

    // Setting up the points (rings) based on "pointsData"
    globe.ringsData(pointsData)
        .ringColor(() => colorInterpolator)
        .ringMaxRadius("ringMaxSize")
        .ringPropagationSpeed("ringPropagationSpeed") 

        // Repeat period variable (randomized delay in data)
        .ringRepeatPeriod("ringRepeatPeriod"); 
};


export function addRingsDataStatic(
    globe: ThreeGlobe, 
    pointsData: PlottedCoordinatePoint[]
) {
    if (!globe) return;

    globe.ringsData(pointsData)
        // Ring color static since no movement
        .ringColor(() => "rgba(230, 255, 50, 0.9)")

        // Smaller radius & zero movement
        .ringMaxRadius(0.5)
        .ringPropagationSpeed(0) 
        .ringRepeatPeriod(0); 
};


export function clearRingsData(globe: ThreeGlobe) {
    if (!globe) return;

    // Clear all rings by passing empty data
    globe.ringsData([]); 
}


export function addPointsData(
    globe: ThreeGlobe, 
    pointsData: PlottedCoordinatePoint[]
) {
    if (!globe) return;
    
    globe.pointsData(pointsData)
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
  

export async function resetGlobe(
    camera: THREE.PerspectiveCamera, 
    pitchRef: React.RefObject<THREE.Object3D<THREE.Object3DEventMap>>, 
    yawRef: React.RefObject<THREE.Object3D<THREE.Object3DEventMap>>
) {
    // Start with camera zooming out.. far!
    new JEasing(camera.position)
        .to({ x: 0, y: 0, z: 300 }, 1000) 
        .easing(Cubic.InOut)
        .start();

    // Then reset pitch & yaw rotations
    new JEasing(pitchRef.current.rotation)
        .to({ x: 0, y: 0, z: 0 }, 1025) 
        .easing(Cubic.InOut)
        .start();

    new JEasing(yawRef.current.rotation)
        .to({ x: 0, y: 0, z: 0 }, 1050)
        .easing(Cubic.InOut)
        .start();

    // Finally, animate camera's zoom to reset position
    new JEasing(camera.position)
        .to({ x: 0, y: 0, z: 200 }, 1075)
        .easing(Cubic.InOut)
        .start();

    JEASINGS.update();
};


// Ease camera view to coords point for globe storytelling
export function goToCoordinates(
    lat: number, lng: number, 
    pitchRef: React.RefObject<THREE.Object3D<THREE.Object3DEventMap>>, 
    yawRef: React.RefObject<THREE.Object3D<THREE.Object3DEventMap>>
) {
    new JEasing(pitchRef.current.rotation)
        // Convert latitude to radians, & animate over 1000 ms (1 sec)
        .to(
            { x: (lat / 180) * Math.PI * -1 },
            1000
        )
        .easing(Cubic.InOut)
        .start()

    new JEasing(yawRef.current.rotation)
        // Convert longitude to radians, & animate over 1000 ms (1 sec)
        .to(
            { y: (lng / 180) * Math.PI },
            1000
        )
        .easing(Cubic.InOut)
        .start()
};


export async function playStoryMode(
    globe: ThreeGlobe, 
    controls: OrbitControls, 
    camera: THREE.PerspectiveCamera, 
    pitchRef: React.RefObject<THREE.Object3D<THREE.Object3DEventMap>>, 
    yawRef: React.RefObject<THREE.Object3D<THREE.Object3DEventMap>>, 
    sharkID: string, 
    onPointChange?: (point: PlottedCoordinatePoint) => void
) {
    const sortedPointsData = getSharkCoordinates(sharkID);
    if (!globe || !sortedPointsData.length) return;
    
    // Have camera zoom into globe gradually, over 2.5 sec period
    new JEasing(camera.position)
        .to({ z: 150 }, 2500) 
        .easing(Cubic.InOut)
        .start();

    console.log(`Playing story for shark ID: ${sharkID}`);

    for (let i = 0; i < sortedPointsData.length; i++) {
        const point = sortedPointsData[i];
        console.log(point);

        goToCoordinates(point.lat, point.lng, pitchRef, yawRef);

        // Wait 2 sec after zoom in before starting story
        if (i == 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    
        // Show ripple for this current singular point
        addRingsData(globe, [point]);

        // Align text display of coords (+ timestamp) with ripple plotting
        await new Promise(resolve => setTimeout(resolve, 500));
        if (onPointChange) {
            onPointChange(point);
        }

        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Clear final ripple & restore orbit controls after story told
    setTimeout(() => {
        clearAllData(globe);
        controls.enabled = true;
    }, 1000);
};


export async function highlightSharkMode(
    globe: ThreeGlobe, 
    controls: OrbitControls, 
    camera: THREE.PerspectiveCamera, 
    pitchRef: React.RefObject<THREE.Object3D<THREE.Object3DEventMap>>, 
    yawRef: React.RefObject<THREE.Object3D<THREE.Object3DEventMap>>, 
    sharkID: string, 
    usePoints: boolean = false, 
    keepControlsDisabled: boolean = false
) {
    const sortedPointsData = getSharkCoordinates(sharkID);
    if (!globe || !sortedPointsData.length) return;
    
    // Have camera zoom into globe gradually, over 2.5 sec period
    new JEasing(camera.position)
        .to({ z: 150 }, 2500) 
        .easing(Cubic.InOut)
        .start();

    console.log(`Highlighting shark ID: ${sharkID} with ${usePoints ? "points" : "ripples"}`);

    // Show either points or ripples for this whale shark
    if (usePoints) {
        addPointsData(globe, sortedPointsData);
    } 
    else {
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
};



