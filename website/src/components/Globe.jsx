import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import earthImg from '../assets/images/three-globe-imgs/earth-blue-marble.jpg';
import bumpImg from '../assets/images/three-globe-imgs/earth-topology.png';

const Globe = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const globeContainer = mountRef.current;
    if (!globeContainer) return;

    const globe = new ThreeGlobe()
        .globeImageUrl(earthImg)
        .bumpImageUrl(bumpImg)
        // .ringsData(pointsData)
        // .ringColor(() => colorInterpolator)
        // .ringMaxRadius('ringMaxSize')
        // .ringPropagationSpeed('ringPropagationSpeed')
        // .ringRepeatPeriod('ringRepeatPeriod');

        
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
    scene.add(new THREE.AmbientLight(0xcccccc, 0.5 * Math.PI));

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

    controls.minDistance = 120;
    controls.maxDistance = 250;


    // Animation loop
    const animate = () => {
      controls.update();
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
};

export default Globe;
