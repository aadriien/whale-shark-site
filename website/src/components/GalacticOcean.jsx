import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";

import { createReef, animateReef, createCurrent, animateCurrent } from "./ReefCurrentAnimated.jsx";
import GlowSharkAnimated from "./GlowSharkAnimated.jsx";


function createNebula(scene) {
    // Stars particle system
    const starCount = 2500;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        starPositions[i * 3] = (Math.random() - 0.5) * 2200;
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 800;
        starPositions[i * 3 + 2] = (Math.random() - 0.5) * 2200;

        // Soft multicolor stars in blue-purple range
        const hue = 220 + Math.random() * 80; // 220-300 degrees (blue to purple)
        const color = new THREE.Color(`hsl(${hue}, 70%, 85%)`);
        starColors[i * 3] = color.r;
        starColors[i * 3 + 1] = color.g;
        starColors[i * 3 + 2] = color.b;
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Nebula cloud particles
    const nebulaCount = 12000;
    const nebulaGeometry = new THREE.BufferGeometry();
    const nebulaPositions = new Float32Array(nebulaCount * 3);
    const nebulaColors = new Float32Array(nebulaCount * 3);
    const nebulaSizes = new Float32Array(nebulaCount);

    for (let i = 0; i < nebulaCount; i++) {
        nebulaPositions[i * 3] = (Math.random() - 0.5) * 1600;
        nebulaPositions[i * 3 + 1] = (Math.random() - 0.3) * 600; // slightly biased upwards
        nebulaPositions[i * 3 + 2] = (Math.random() - 0.5) * 1600;

        // Soft pastel nebula colors
        const baseHue = 280; // purple-ish
        const hue = baseHue + (Math.random() - 0.5) * 40;
        const saturation = 60 + Math.random() * 30;
        const lightness = 60 + Math.random() * 20;
        const color = new THREE.Color(`hsl(${hue}, ${saturation}%, ${lightness}%)`);

        nebulaColors[i * 3] = color.r;
        nebulaColors[i * 3 + 1] = color.g;
        nebulaColors[i * 3 + 2] = color.b;

        nebulaSizes[i] = 1 + Math.random() * 3;
    }

    nebulaGeometry.setAttribute("position", new THREE.BufferAttribute(nebulaPositions, 3));
    nebulaGeometry.setAttribute("color", new THREE.BufferAttribute(nebulaColors, 3));
    nebulaGeometry.setAttribute("size", new THREE.BufferAttribute(nebulaSizes, 1));

    // Nebula shader material
    const nebulaVertexShader = `
        attribute float size;
        varying vec3 vColor;
        void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
    `;

    const nebulaFragmentShader = `
        varying vec3 vColor;
        void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            float alpha = smoothstep(0.5, 0.45, dist);
            gl_FragColor = vec4(vColor, alpha * 0.2);
        }
    `;

    const nebulaMaterial = new THREE.ShaderMaterial({
        vertexShader: nebulaVertexShader,
        fragmentShader: nebulaFragmentShader,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
    scene.add(nebula);

    return { stars, nebula };
}


function createOcean(scene) {
    // Ripple line (separator)
    // const lineSegments = 200;
    // const linePositions = new Float32Array(lineSegments * 3);
    // for (let i = 0; i < lineSegments; i++) {
    //     const x = (i / (lineSegments - 1)) * 1600 - 800; // -800 to 800 on x
    //     linePositions[i * 3] = x;
    //     linePositions[i * 3 + 1] = 0; // y=0 baseline
    //     linePositions[i * 3 + 2] = 0;
    // }
    // const lineGeometry = new THREE.BufferGeometry();
    // lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    // const rippleVertexShader = `
    //     uniform float time;
    //     varying float vAlpha;
    //     void main() {
    //         vec3 pos = position;
    //         float frequency = 0.02;
    //         float amplitude = 8.0;
    //         pos.y += sin(pos.x * frequency + time * 2.0) * amplitude;
    //         vAlpha = 0.4 + 0.6 * (sin(pos.x * frequency * 10.0 + time * 5.0) * 0.5 + 0.5);
    //         gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    //     }
    // `;

    // const rippleFragmentShader = `
    //     varying float vAlpha;
    //     void main() {
    //         vec3 color = vec3(0.0, 0.4, 0.6); // soft teal ocean line
    //         gl_FragColor = vec4(color, vAlpha * 0.35);
    //     }
    // `;

    // const rippleMaterial = new THREE.ShaderMaterial({
    //     vertexShader: rippleVertexShader,
    //     fragmentShader: rippleFragmentShader,
    //     transparent: true,
    //     depthWrite: false,
    //     blending: THREE.AdditiveBlending,
    //     uniforms: { time: { value: 0 } },
    // });

    // const rippleLine = new THREE.Line(lineGeometry, rippleMaterial);
    // scene.add(rippleLine);


    // Ocean plane below ripple line
    const oceanGeometry = new THREE.PlaneGeometry(2430, 800, 80, 40);

    const positionAttr = oceanGeometry.attributes.position;
    const vertexCount = positionAttr.count;

    for (let i = 0; i < vertexCount; i++) {
        let x = positionAttr.getX(i);
        let y = positionAttr.getY(i);

        // y goes from -400 to +400 (height = 800)
        // We want to "push in" vertices near the top edge (y near +400) inward in x,
        // forming a rounded curve inward near the top.

        const heightHalf = 400;
        // const widthHalf = 7000; 
        const widthHalf = 0;

        if (y > heightHalf * 0.7) { // top 30% of plane height
            // Calculate how far y is from top edge
            const distFromTop = heightHalf - y; // 0 at top edge, increasing downward

            // Pull x coordinate inward proportional to curveAmount to form a semicircle arc top
            // Map curveAmount from 0..heightHalf to 0..widthHalf
            const maxCurve = widthHalf * 0.6; // controls curve width
            const xCurve = (distFromTop / heightHalf) * maxCurve;

            // Clamp x inward if outside this curve:
            if (Math.abs(x) > xCurve) {
                const sign = x > 0 ? 1 : -1;
                positionAttr.setX(i, sign * xCurve);
            }
        }
    }
    positionAttr.needsUpdate = true;


    // // Ocean vertex shader: subtle wave displacements with time
    // const oceanVertexShader = `
    //     uniform float time;
    //     varying vec2 vUv;
    //     void main() {
    //         vUv = uv;
    //         vec3 pos = position;
    //         float waveFreq = 0.5;
    //         float waveAmp = 5.0;
    //         pos.z += sin(pos.x * waveFreq + time * 1.5) * waveAmp;
    //         pos.z += cos(pos.y * waveFreq * 1.3 + time * 1.8) * waveAmp * 0.5;
    //         gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    //     }
    // `;

    // // Ocean fragment shader: bluish gradient with subtle glow
    // const oceanFragmentShader = `
    //     varying vec2 vUv;
    //     void main() {
    //         vec3 deepBlue = vec3(0.0, 0.1, 0.3);
    //         vec3 lightBlue = vec3(0.1, 0.4, 0.6);
    //         float alpha = smoothstep(0.0, 0.7, vUv.y);
    //         vec3 color = mix(deepBlue, lightBlue, vUv.y);
    //         gl_FragColor = vec4(color, alpha * 0.6);
    //     }
    // `;

    // const oceanVertexShader = `
    //     uniform float time;
    //     varying vec2 vUv;
    //     void main() {
    //         vUv = uv;
    //         vec3 pos = position;

    //         // Wave frequency and amplitude vary with vertical position (vUv.y)
    //         float freqBase = 0.5;
    //         float freq = mix(0.2, freqBase, vUv.y);  // Wider waves near top (lower freq)
    //         float ampBase = 5.0;
    //         float amp = mix(7.0, ampBase, vUv.y);    // Slightly higher amplitude at top

    //         pos.z += sin(pos.x * freq + time * 1.5) * amp;
    //         pos.z += cos(pos.y * freq * 1.3 + time * 1.8) * amp * 0.5;

    //         gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    //     }
    // `;

    // // Ocean fragment shader: bluish gradient with subtle glow
    // const oceanFragmentShader = `
    //     varying vec2 vUv;
    //     void main() {
    //         vec3 deepBlue = vec3(0.0, 0.1, 0.3);
    //         vec3 lightBlue = vec3(0.1, 0.4, 0.6);
    //         float alpha = smoothstep(0.0, 0.7, vUv.y);
    //         vec3 color = mix(deepBlue, lightBlue, vUv.y);
    //         gl_FragColor = vec4(color, alpha * 0.6);
    //     }
    // `;

    // const oceanVertexShader = `
    //     uniform float time;
    //     varying vec2 vUv;
    //     void main() {
    //         vUv = uv;
    //         vec3 pos = position;

    //         // Wave frequency and amplitude vary with vertical position (vUv.y)
    //         // Lower frequency = wider waves near top; higher freq at bottom for more detail
    //         float freqBase = 0.5;
    //         float freqX = mix(0.2, freqBase, vUv.y);  // Horizontal wave frequency (x axis)
    //         float ampBase = 5.0;
    //         float ampX = mix(7.0, ampBase, vUv.y);    // Horizontal wave amplitude

    //         // Vertical wave frequency & amplitude to keep those sharp streaks shimmering down
    //         float freqY = freqX * 1.3;
    //         float ampY = ampX * 0.5;

    //         pos.z += sin(pos.x * freqX + time * 1.5) * ampX;
    //         pos.z += cos(pos.y * freqY + time * 1.8) * ampY;

    //         gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    //     }
    // `;

    // const oceanFragmentShader = `
    //     varying vec2 vUv;
    //     void main() {
    //         vec3 deepBlue = vec3(0.0, 0.1, 0.3);
    //         vec3 lightBlue = vec3(0.1, 0.4, 0.6);
    //         float alpha = smoothstep(0.0, 0.7, vUv.y);
    //         vec3 color = mix(deepBlue, lightBlue, vUv.y);
    //         gl_FragColor = vec4(color, alpha * 0.6);
    //     }
    // `;

    // Ocean vertex shader: subtle wave displacements with time
    const oceanVertexShader = `
        uniform float time;
        varying vec2 vUv;
        void main() {
            vUv = uv;
            vec3 pos = position;
            float waveFreq = 0.5;
            float waveAmp = 5.0;
            pos.z += sin(pos.x * waveFreq + time * 1.5) * waveAmp;
            pos.z += cos(pos.y * waveFreq * 1.3 + time * 1.8) * waveAmp * 0.5;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `;

    // Ocean fragment shader: bluish gradient with subtle glow
    const oceanFragmentShader = `
        varying vec2 vUv;
        void main() {
            vec3 deepBlue = vec3(0.0, 0.1, 0.3);
            vec3 lightBlue = vec3(0.1, 0.4, 0.6);
            float alpha = smoothstep(0.0, 0.7, vUv.y);
            vec3 color = mix(deepBlue, lightBlue, vUv.y);
            float centerGlow = exp(-8.0 * pow(vUv.x - 0.5, 2.0)); // narrow gaussian glow at center
            color += vec3(0.1, 0.2, 0.3) * centerGlow;
            gl_FragColor = vec4(color, alpha * 0.6);
        }
    `;


    const oceanMaterial = new THREE.ShaderMaterial({
        vertexShader: oceanVertexShader,
        fragmentShader: oceanFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
            time: { value: 0 },
        },
        side: THREE.DoubleSide,
    });

    const oceanPlane = new THREE.Mesh(oceanGeometry, oceanMaterial);
    oceanPlane.rotation.x = -Math.PI * (80 / 180); // horizontal plane
    oceanPlane.position.y = 90; // switch between 130 & 50 to toggle upside down ocean
    scene.add(oceanPlane);

    const oceanMesh = new THREE.Mesh(oceanGeometry, oceanMaterial);
    oceanMesh.rotation.x = -Math.PI * (50 / 180);
    oceanMesh.position.y = 300; 
    scene.add(oceanMesh);

    return oceanMaterial;
}


function GalacticOcean() {
    const mountRef = useRef();
    const cameraRef = useRef();

    // Store for clickable Research Reef & Creative Current particle blobs
    const navigate = useNavigate();
    const raycaster = useRef(new THREE.Raycaster());
    const mouse = useRef(new THREE.Vector2());
    const clickableMeshes = useRef([]);


    useEffect(() => {
        if (!mountRef.current) return;

        // Scene & camera setup
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x000010, 500, 2000);

        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            4000
        );
        camera.position.set(0, 100, 400);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000010);
        mountRef.current.appendChild(renderer.domElement);

        // Controls (static)
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.enableRotate = false;

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x8888aa, 1);
        scene.add(ambientLight);


        // Create starry nebula & rippling ocean, then add into scene
        const { stars, nebula } = createNebula(scene);
        const oceanMaterial = createOcean(scene);


        // Create research reef & creative current objects
        const reef = createReef();
        reef.scale.set(2, 2, 2);
        scene.add(reef);

        const current = createCurrent();
        current.scale.set(2, 2, 2);
        scene.add(current);

        reef.position.set(-450, -130, 0); 
        current.position.set(450, -130, 0); 

        // Add their invisible meshes to clickable list
        reef.traverse((child) => {
            if (child.isMesh && child.name === "reef") clickableMeshes.current.push(child);
        });
        current.traverse((child) => {
            if (child.isMesh && child.name === "current") clickableMeshes.current.push(child);
        });

        const handleClick = (event) => {
            if (!mountRef.current) return;

            console.log("click detected!");

            const rect = mountRef.current.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.current.setFromCamera(mouse, camera);
            const intersects = raycaster.current.intersectObjects(clickableMeshes.current, true);

            if (intersects.length > 0) {
                const clickedName = intersects[0].object.name;
                if (clickedName === "reef") {
                    navigate("/research");
                } 
                else if (clickedName === "current") {
                    navigate("/creative");
                }
            }
        };

        mountRef.current.addEventListener("click", handleClick);



        // Post-processing setup
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.2, 1, 0.3
        );
        composer.addPass(bloomPass);

        // Animate loop
        const clock = new THREE.Clock();

        function animate() {
            requestAnimationFrame(animate);
            const elapsed = clock.getElapsedTime();

            stars.rotation.y = elapsed * 0.02;
            nebula.rotation.y = elapsed * 0.008;
            // rippleMaterial.uniforms.time.value = elapsed;
            oceanMaterial.uniforms.time.value = elapsed;

            animateReef(reef);
            animateCurrent(current);

            composer.render();
        }

        animate();

        // Handle window resizing
        function onResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        }
        window.addEventListener("resize", onResize);

        // Cleanup on unmount
        return () => {
            window.removeEventListener("resize", onResize);

            if (
                mountRef.current &&
                renderer.domElement.parentElement === mountRef.current
            ) {
                mountRef.current.removeChild(renderer.domElement);
                mountRef.current.removeEventListener("click", handleClick);
            }
            renderer.dispose();
        };
    }, [navigate]);

    return (
        <div
            ref={mountRef}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 1,
                backgroundColor: "#000010",
            }}
        >
            {/* Render whale shark on top but in same layer */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 10,

                    // Let mouse through for blob clicks (blocks orbit controls!!)
                    pointerEvents: "none", 
                }}
            >
                <GlowSharkAnimated />
            </div>
        </div>
    );
}

export default GalacticOcean;

