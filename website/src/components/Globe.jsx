import React, { useEffect, useRef } from "react";
import { forwardRef, useImperativeHandle } from "react";

import * as THREE from "three";
import JEASINGS from "../utils/JEasings/JEasings.ts";

import { 
    createGlobe, createLights, createCamera, createControls,
    setupCameraAngles, resetGlobe, playStoryMode, highlightSharkMode, 
} from "../utils/GlobeUtils.js";


const Globe = forwardRef((props, ref) => {
    const mountRef = useRef(null);
    
    // Hoist these so playStory can access them
    const globeRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    
    const pivotRef = useRef(null);
    const yawRef = useRef(null);
    const pitchRef = useRef(null);
    
    
    const playStory = async (sharkID) => {
        if (!globeRef.current || !controlsRef.current || !cameraRef.current) return;
        
        resetGlobe(cameraRef.current, pitchRef, yawRef);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await playStoryMode(
            globeRef.current, controlsRef.current, cameraRef.current, 
            pitchRef, yawRef, sharkID
        );
    };


    const highlightShark = async (sharkID) => {
        if (!globeRef.current || !controlsRef.current || !cameraRef.current) return;
        
        resetGlobe(cameraRef.current, pitchRef, yawRef);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await highlightSharkMode(
            globeRef.current, controlsRef.current, cameraRef.current, 
            pitchRef, yawRef, sharkID
        );
    };
        
    
    // Expose globe instance, playStory, highlightShark methods to parent
    useImperativeHandle(ref, () => ({
        getGlobe: () => globeRef.current,
        playStory,
        highlightShark,
    }));
    
    
    useEffect(() => {
        const globeContainer = mountRef.current;
        if (!globeContainer) return;
        
        
        const scene = new THREE.Scene();
        
        const globe = createGlobe();
        scene.add(globe);
        
        
        const { ambientLight, directionalLight } = createLights();
        scene.add(ambientLight);
        scene.add(directionalLight);
        
        const camera = createCamera(globeContainer);
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        
        
        // Add Euler angles for goToCoordinates storytelling
        const { pivot, yaw, pitch } = setupCameraAngles(scene, camera);
        
        pivotRef.current = pivot;
        yawRef.current = yaw;
        pitchRef.current = pitch;
        
        
        
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
        
        window.addEventListener("resize", resizeCanvas);
        
        
        // OrbitControls setup
        const controls = createControls(camera, renderer);
        
        
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
            window.removeEventListener("resize", resizeCanvas);
            
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
                width: "100%",
                height: "100%",
            }}
        />
    );
});
        
export default Globe;
        