import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import JEASINGS, { JEasing, Cubic } from './JEasings/JEasings.ts';

import { getSharkCoordinates } from './CoordinateUtils.js';

import earthImg from '../assets/images/three-globe-imgs/earth-blue-marble.jpg';
import bumpImg from '../assets/images/three-globe-imgs/earth-topology.png';


export function createGlobe() {
    const globe = new ThreeGlobe()
        .globeImageUrl(earthImg)
        .bumpImageUrl(bumpImg);
  
    const material = new THREE.MeshStandardMaterial({
        color: 0x0055ff,
        roughness: 0.7,
        metalness: 0.3,
        emissive: 0xFFD700,
        emissiveIntensity: 3,
    });
  
    globe.material = material;
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


export function createCamera(globeContainer) {
    const camera = new THREE.PerspectiveCamera(
        75,
        globeContainer.clientWidth / globeContainer.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 200);

    return camera;
};


export function createControls(camera, renderer) {
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
  

export function setupCameraAngles(scene, camera) {
    // Euler angles for managing globe storytelling
    const pivot = new THREE.Object3D() // point around which globe rotates
    const yaw = new THREE.Object3D() // y-axis (vertical), turn left/right
    const pitch = new THREE.Object3D() // x-axis (horizontal), tilt up/down
  
    scene.add(pivot);
    pivot.add(yaw);
    yaw.add(pitch);
    pitch.add(camera);
  
    return { pivot, yaw, pitch };
};

  

// Color Interpolator for ring effects
export function colorInterpolator(t) {
    // Yellow (255, 255, 0) -> Neon Cyan (0, 255, 255) transition
    const r = Math.round(255 - t * 255);  // Transition from yellow to red
    const g = Math.round(255);             // Keep green constant (255)
    const b = Math.round(t * 255);        // Transition from no blue to full cyan
    return `rgba(${r}, ${g}, ${b}, ${0.9 + (1 - t) * 0.1})`;  // Hold opacity
};



export function addRingsData(globe, pointsData) {
    if (!globe) return;

    // Setting up the points (rings) based on 'pointsData'
    globe.ringsData(pointsData)
        .ringColor(() => colorInterpolator)
        .ringMaxRadius('ringMaxSize')
        .ringPropagationSpeed('ringPropagationSpeed') 

        // Repeat period variable (randomized delay in data)
        .ringRepeatPeriod('ringRepeatPeriod'); 
};


export function addRingsDataStatic(globe, pointsData) {
    if (!globe) return;

    globe.ringsData(pointsData)
        // Ring color static since no movement
        .ringColor(() => 'rgba(230, 255, 50, 0.9)')

        // Smaller radius & zero movement
        .ringMaxRadius(0.5)
        .ringPropagationSpeed(0) 
        .ringRepeatPeriod(0); 
};


export function clearRingsData(globe) {
    if (!globe) return;

    // Clear all rings by passing empty data
    globe.ringsData([]); 
}
  

export async function resetGlobe(camera, pitchRef, yawRef) {
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
export function goToCoordinates(lat, long, pitchRef, yawRef) {
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
            { y: (long / 180) * Math.PI },
            1000
        )
        .easing(Cubic.InOut)
        .start()
};


export async function playStoryMode(globe, controls, camera, pitchRef, yawRef, sharkID) {
    const sortedPointsData = getSharkCoordinates(sharkID);
    if (!globe || !sortedPointsData.length) return;

    // If story mode, disable orbit controls (user can't move globe)
    controls.enabled = false;
    
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
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Restore orbit controls after story told
    setTimeout(() => {
        controls.enabled = true;
    }, 1000);
};


export async function highlightSharkMode(globe, controls, camera, pitchRef, yawRef, sharkID) {
    const sortedPointsData = getSharkCoordinates(sharkID);
    if (!globe || !sortedPointsData.length) return;

    // If highlight mode, briefly disable orbit controls (user can't move globe)
    controls.enabled = false;
    
    // Have camera zoom into globe gradually, over 2.5 sec period
    new JEasing(camera.position)
        .to({ z: 150 }, 2500) 
        .easing(Cubic.InOut)
        .start();

    console.log(`Highlighting shark ID: ${sharkID}`);

    // Show ripples for just this whale shark
    addRingsData(globe, sortedPointsData);
    const point = sortedPointsData[0];
    goToCoordinates(point.lat, point.lng, pitchRef, yawRef);

    // Restore orbit controls
    setTimeout(() => {
        controls.enabled = true;
    }, 1000);
};



