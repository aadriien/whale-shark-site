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

    const raycaster = useRef(new THREE.Raycaster());
    const mouse = useRef(new THREE.Vector2());

    const allowClicksRef = useRef(props.allowClicks);

    const playStory = async (sharkID) => {
        if (!globeRef.current || !controlsRef.current || !cameraRef.current) return;
        
        // Disable orbit controls BEFORE any animation (to be resumed once finished)
        controlsRef.current.enabled = false;
        
        resetGlobe(cameraRef.current, pitchRef, yawRef);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await playStoryMode(
            globeRef.current, controlsRef.current, cameraRef.current, 
            pitchRef, yawRef, sharkID
        );
    };


    const highlightShark = async (sharkID) => {
        if (!globeRef.current || !controlsRef.current || !cameraRef.current) return;
        
        // Disable orbit controls BEFORE any animation (to be resumed once finished)
        controlsRef.current.enabled = false;

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


    // Keep track of whether open clicking allowed (shark selected in globe views?)
    useEffect(() => {
        allowClicksRef.current = props.allowClicks;
    }, [props.allowClicks]);

    
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

        // OrbitControls setup
        const controls = createControls(camera, renderer);
            
        // Set for playStory
        globeRef.current = globe;
        cameraRef.current = camera;
        controlsRef.current = controls;


        const handleClick = (event) => {
            if (!mountRef.current || !globeRef.current) return;

            // Prevent override of selected shark in globe clicking 
            if (!allowClicksRef.current) {
                console.log("Click ignored: allowClicks is false (shark already highlighted).");
                return;
            }

            const rect = mountRef.current.getBoundingClientRect();
            mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.current.setFromCamera(mouse.current, cameraRef.current);
            const intersects = raycaster.current.intersectObject(globeRef.current);

            if (intersects.length > 0) {
                const intersect = intersects[0];
                const point = intersect.point.clone();

                const globeRadius = globeRef.current.scale.x || 1;
                const normalizedPoint = point.clone().normalize();

                // Determine coords, then send up to parent to find nearest shark
                const lat = Math.asin(normalizedPoint.y / globeRadius) * (180 / Math.PI);
                const lng = Math.atan2(normalizedPoint.x, normalizedPoint.z) * (180 / Math.PI);

                console.log(`Clicked at lat: ${lat.toFixed(4)}, lng: ${lng.toFixed(4)}`);

                if (props.onSharkClick) {
                    props.onSharkClick({ lat, lng });
                }
            } 
            else {
                console.log("No intersection with globe.");
            }
        };

        window.addEventListener("resize", resizeCanvas);
        mountRef.current.addEventListener("click", handleClick);

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
            if (mountRef.current) mountRef.current.removeEventListener("click", handleClick);

            if (globeContainer.contains(renderer.domElement)) {
                globeContainer.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    return (
        <div ref={mountRef}
            style={{ 
                width: "100%", 
                height: "100%", 
            }}
        />
    );
});

export default Globe;


