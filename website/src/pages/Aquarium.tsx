import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createLights, createCamera } from "../utils/GlobeUtils";

function Aquarium() {
    return (
        <div className="aquarium-wrapper">
            <div style={{ width: "100vw", height: "100vh" }}>
                <AquariumTest />
            </div>
        </div>
    );
}

export default Aquarium;

function AquariumTest() {
    const mountRef = useRef<HTMLDivElement | null>(null);

    // Hoist these so playStory can access them
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

    const raycaster = useRef<THREE.Raycaster>(new THREE.Raycaster());
    const mouse = useRef<THREE.Vector2>(new THREE.Vector2());

    useEffect(() => {
        const globeContainer = mountRef.current;
        if (!globeContainer) return;

        const scene = new THREE.Scene();

        const { ambientLight, directionalLight } = createLights();
        scene.add(ambientLight);
        scene.add(directionalLight);

        const camera = createCamera(globeContainer);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true });

        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        camera.position.z = 5;

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

        const handleClick = (event: MouseEvent) => {
            if (!mountRef.current || !cameraRef.current) return;

            const rect = mountRef.current.getBoundingClientRect();
            mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            console.log(`X: $${mouse.current.x} and Y: $${mouse.current.y}`);

            raycaster.current.setFromCamera(mouse.current, cameraRef.current!);
            const intersects = raycaster.current.intersectObject(mesh);

            if (intersects.length > 0) {
                const intersect = intersects[0];
                const point = intersect.point.clone();

                const normalizedPoint = point.clone().normalize();
                console.log(normalizedPoint);

                // // Determine coords, then send up to parent to find nearest shark
                // const lat = Math.asin(normalizedPoint.y / globeRadius) * (180 / Math.PI);
                // const lng = Math.atan2(normalizedPoint.x, normalizedPoint.z) * (180 / Math.PI);

                // console.log(`Clicked at lat: ${lat.toFixed(4)}, lng: ${lng.toFixed(4)}`);
            } else {
                console.log("No intersection with globe.");
            }
        };

        window.addEventListener("resize", resizeCanvas);
        globeContainer.addEventListener("click", handleClick);

        const animate = () => {
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };
        animate();

        // Cleanup on component unmount
        return () => {
            window.removeEventListener("resize", resizeCanvas);

            // Remove renderer's canvas
            globeContainer.removeEventListener("click", handleClick);

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
}
