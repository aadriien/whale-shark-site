import React, { useEffect, useRef } from 'react';
import { forwardRef, useImperativeHandle } from "react";

import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import JEASINGS, { JEasing, Cubic } from '../utils/JEasings/JEasings.ts';

import getCoordinates from '../utils/Coordinates.js';

import earthImg from '../assets/images/three-globe-imgs/earth-blue-marble.jpg';
import bumpImg from '../assets/images/three-globe-imgs/earth-topology.png';


const pointsData = getCoordinates();


// Color Interpolator for ring effects
const colorInterpolator = t => {
    // Yellow (255, 255, 0) -> Neon Cyan (0, 255, 255) transition
    const r = Math.round(255 - t * 255);  // Transition from yellow to red
    const g = Math.round(255);             // Keep green constant (255)
    const b = Math.round(t * 255);        // Transition from no blue to full cyan
    return `rgba(${r}, ${g}, ${b}, ${0.9 + (1 - t) * 0.1})`;  // Hold opacity
};



// Euler angles for managing globe storytelling
const pivot = new THREE.Object3D() // point around which globe rotates
const yaw = new THREE.Object3D() // y-axis (vertical), turn left/right
const pitch = new THREE.Object3D() // x-axis (horizontal), tilt up/down



// Ease camera view to coords point for globe storytelling
const goTo = (lat, long) => {
    new JEasing(pitch.rotation)
        // Convert latitude to radians, & animate over 2000 ms (2 sec)
        .to(
            { x: (lat / 180) * Math.PI * -1 },
            1000
        )
        .easing(Cubic.InOut)
        .start()
    new JEasing(yaw.rotation)
        // Convert longitude to radians, & animate over 2000 ms (2 sec)
        .to(
            { y: (long / 180) * Math.PI },
            1000
        )
        .easing(Cubic.InOut)
        .start()
}


const playStoryMode = async (sortedPoints, globe, controls, camera) => {
    if (!globe || !sortedPoints.length) return;

    for (let i = 0; i < sortedPoints.length; i++) {
      const point = sortedPoints[i];

      console.log(point)

      goTo(point.lat, point.lng)
  
  
      // Show ripple for this point
      globe.ringsData([point])
        .ringColor(() => colorInterpolator)
        .ringMaxRadius('ringMaxSize')
        .ringPropagationSpeed('ringPropagationSpeed') 
        .ringRepeatPeriod('ringRepeatPeriod'); 
  
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
};



const Globe = forwardRef((props, ref) => {
    const mountRef = useRef(null);

    // Hoist these so playStory can access them
    const globeRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);

    const playStory = async () => {
        if (!globeRef.current || !controlsRef.current || !cameraRef.current) return;
        await playStoryMode(pointsData, globeRef.current, controlsRef.current, cameraRef.current);
    };
    
    useImperativeHandle(ref, () => ({
        playStory
    }));


  useEffect(() => {
    const globeContainer = mountRef.current;
    if (!globeContainer) return;

    const globe = new ThreeGlobe()
        .globeImageUrl(earthImg)
        .bumpImageUrl(bumpImg)

  
    // Setting up the points (rings) based on `pointsData`
    // globe.ringsData(pointsData)
    //     .ringColor(() => colorInterpolator)
    //     .ringMaxRadius('ringMaxSize')
    //     .ringPropagationSpeed('ringPropagationSpeed') 
    //     .ringRepeatPeriod('ringRepeatPeriod'); 


    // Material for the globe with roughness
    const globeMaterial = new THREE.MeshStandardMaterial({
        color: 0x0055ff, 
        roughness: 0.7,  
        metalness: 0.3,  
        emissive: 0xFFD700, 
        emissiveIntensity: 1, 
    });
    globe.material = globeMaterial;

    globe.scale.set(1, 1, 1);
    globe.visible = true;

    const scene = new THREE.Scene();
    scene.add(globe);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5 * Math.PI));

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI);
    directionalLight.position.set(0, 1, 1); 
    scene.add(directionalLight);

    
    const camera = new THREE.PerspectiveCamera(
        75,
        globeContainer.clientWidth / globeContainer.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 200);


    const renderer = new THREE.WebGLRenderer({ antialias: true });


    // Add Euler angles for goTo storytelling
    scene.add(pivot)
    pivot.add(yaw)
    yaw.add(pitch)
    pitch.add(camera)



    const resizeCanvas = () => {
        if (!globeContainer.offsetWidth || !globeContainer.offsetHeight) return;
  
        const containerWidth = globeContainer.offsetWidth;
        const containerHeight = globeContainer.offsetHeight;
  
        // Increase pixel density for clarity
        renderer.setSize(containerWidth, containerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
  
        camera.aspect = containerWidth / containerHeight;
        camera.updateProjectionMatrix();
      };
  
      // Attach renderer to DOM after size is set
      const initGlobe = () => {
        if (!globeContainer.contains(renderer.domElement)) {
          globeContainer.appendChild(renderer.domElement);
        }
        resizeCanvas();
      };
  
      // Call initGlobe initially
      initGlobe();

      window.addEventListener('resize', resizeCanvas);


    // OrbitControls setup
    const controls = new OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.rotateSpeed = 0.5;

    controls.enableZoom = true;
    controls.autoRotate = false;

    controls.minDistance = 125;
    controls.maxDistance = 220;


    // Set for playStory
    globeRef.current = globe;
    cameraRef.current = camera;
    controlsRef.current = controls;


    // Animation loop
    const animate = () => {
      controls.update();

      JEASINGS.update();

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('resize', resizeCanvas);

      // Remove renderer's canvas
      if (globeContainer.contains(renderer.domElement)) {
        globeContainer.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []); 

  return (
    <div
      ref={mountRef}
      style={{
        width: '80%',
        height: '500px',
        position: 'relative',
        margin: 'auto', 
        overflow: 'hidden',
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',    
      }}
    />
  );
});

export default Globe;
