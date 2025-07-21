import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import SharkModelPoints3D from "../assets/data/json/shark_model_extracted_points_3d.json";

function GlowSharkAnimated() {
    const containerRef = useRef();

    useEffect(() => {
        const container = containerRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x042a3b); // dark blue-green

        const camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            2000
        );
        camera.position.z = 800; 

        // Set up renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);

        const handleResize = () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        };
        window.addEventListener("resize", handleResize);

        // Load & center points cloud
        const rawPoints = Object.values(SharkModelPoints3D);

        const xs = rawPoints.map(p => p.x);
        const ys = rawPoints.map(p => p.y);
        const zs = rawPoints.map(p => p.z);

        const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
        const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
        const centerZ = (Math.min(...zs) + Math.max(...zs)) / 2;

        const maxSpan = Math.max(
            Math.max(...xs) - Math.min(...xs),
            Math.max(...ys) - Math.min(...ys),
            Math.max(...zs) - Math.min(...zs)
        );
        const scaleFactor = 400 / maxSpan;

        const positions = new Float32Array(rawPoints.length * 3);
        const colors = new Float32Array(rawPoints.length * 3);

        const color = new THREE.Color();
        rawPoints.forEach((p, i) => {
            const x = (p.x - centerX) * scaleFactor;
            const y = -(p.y - centerY) * scaleFactor;
            const z = (p.z - centerZ) * scaleFactor;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Start with cyan-ish glow, to animate later
            color.setHSL((i / rawPoints.length), 1.0, 0.6);
            colors.set([color.r, color.g, color.b], i * 3);
        });

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 3,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        const shark = new THREE.Points(geometry, material);
        // Shark facing front means nose to left side of user (sideways)
        shark.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
        scene.add(shark);

        // Define control points for the path that go around the screen bounds
        const pathPoints = [
            new THREE.Vector3(600, 200, 0),
            new THREE.Vector3(-600, 100, -300),
            new THREE.Vector3(-400, -250, 400),
            new THREE.Vector3(500, -300, 300),
            new THREE.Vector3(600, 100, -200),
        ];

        // Create a smooth curve path (looped for continuous movement)
        const curve = new THREE.CatmullRomCurve3(pathPoints);
        curve.closed = true; 

        // Show curve as a line in scene
        const curveGeometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(200));
        const curveMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true });
        const curveLine = new THREE.Line(curveGeometry, curveMaterial);
        scene.add(curveLine);

        const clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);
            const time = clock.getElapsedTime();

            // Hue shift + pulse
            const colors = geometry.attributes.color.array;
            for (let i = 0; i < rawPoints.length; i++) {
                const hue = (time * 0.1 + i / rawPoints.length) % 1;
                const pulse = 0.5 + 0.5 * Math.sin(time + i * 0.01);
                color.setHSL(hue, 1.0, 0.5 + 0.2 * pulse);
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;
            }
            geometry.attributes.color.needsUpdate = true;

            // Move shark along curve (20 sec to complete 1 loop)
            const loopDuration = 20; 
            const t = (time % loopDuration) / loopDuration; // normalized time [0,1]
            const nextT = (t + 0.01) % 1; 
            const currentPos = curve.getPointAt(t);
            const nextPos = curve.getPointAt(nextT);

            shark.position.copy(currentPos);
            shark.up.set(0, 1, 0); // keep consistent up vector
            shark.lookAt(nextPos);

            // Ensure "front" of shark == nose facing "lookAt"
            shark.rotateX(-Math.PI / 2);
            shark.rotateZ(Math.PI);

            controls.update();
            renderer.render(scene, camera);
        };

        animate();

        return () => {
            window.removeEventListener("resize", handleResize);
            container.removeChild(renderer.domElement);
            geometry.dispose();
            material.dispose();
            curveGeometry.dispose();
            curveMaterial.dispose();
        };
    }, []);

    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

export default GlowSharkAnimated;
