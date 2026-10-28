import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createLights, createCamera } from "../utils/GlobeUtils";
import { createSharkSteering } from "../utils/SharkSteering";
import { tintPointColors } from "../utils/SharkTint";
import { getCappedPixelRatio, disposeObject, disposeRenderer } from "../utils/RenderUtils";
import { GlowSharkAnimated } from "components/animations/GlowSharkAnimated";
import { createWaterVolume, WATER_FOG_COLOR } from "components/animations/AquariumWater";
import { createPlanktonLure } from "components/animations/PlanktonLure";
import { createMarineSnow } from "components/animations/MarineSnow";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

// Kept faint on purpose: only brightest cores get a soft halo, so water keeps its depth.
// strength 0 = no visible bloom
const BLOOM = { strength: 0.3, radius: 0.5, threshold: 0.7 };

// Distant shark points are boosted (gain) & only partly faded into the water (fogMix),
// so the body stays readable at depth. pointScale enlarges dots over home page size
const SHARK_VISIBILITY = { gain: 0.8, fogMix: 0.5, pointScale: 1.25 };

const MAX_PIXEL_RATIO = 1.5;

// Per second rate at which shark's borrowed plankton color drains away (0.12 ~ 15-20s to fade)
const SHARK_TINT_FADE = 0.12;

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

        const renderer = new THREE.WebGLRenderer({
            antialias: false,
            powerPreference: "high-performance",
        });

        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(globeContainer.clientWidth, globeContainer.clientHeight),
            BLOOM.strength,
            BLOOM.radius,
            BLOOM.threshold
        );
        composer.addPass(bloomPass);

        const water = createWaterVolume(scene);

        // Create glowing whale shark & add to scene
        const {
            shark,
            geometry: sharkGeometry,
            basePositions: _basePositions,
            curve,
            animateBody,
        } = GlowSharkAnimated();
        shark.scale.set(1, 1, 1);
        scene.add(shark);

        const sharkMaterial = shark.material as THREE.PointsMaterial;
        sharkMaterial.size *= SHARK_VISIBILITY.pointScale;
        sharkMaterial.onBeforeCompile = (shader) => {
            shader.uniforms.uDepthGain = { value: SHARK_VISIBILITY.gain };
            shader.uniforms.uFogMix = { value: SHARK_VISIBILITY.fogMix };

            shader.fragmentShader =
                "uniform float uDepthGain;\nuniform float uFogMix;\n" +
                shader.fragmentShader.replace(
                    "#include <fog_fragment>",
                    `
                    #ifdef USE_FOG
                        float depthT = smoothstep(fogNear, fogFar, vFogDepth);
                        gl_FragColor.rgb *= 1.0 + uDepthGain * depthT;
                        gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, depthT * uFogMix);
                    #endif
                    `
                );
        };

        // Glowing plankton marks click destination, sized in proportion to shark
        sharkGeometry.computeBoundingSphere();
        const sharkRadius = sharkGeometry.boundingSphere!.radius;
        const lure = createPlanktonLure(scene, sharkRadius * 0.6);

        // Frame the shark's swim path in view, derived from path bounds + camera fov/aspect
        // so it adapts to any viewport (no hardcoded camera distance)
        const pathBounds = new THREE.Box3().setFromPoints(curve.getPoints(200));
        const pathSize = pathBounds.getSize(new THREE.Vector3());
        const pathCenter = pathBounds.getCenter(new THREE.Vector3());

        // Swim space reaches deeper than preset path, so shark can recede into the
        // water & return, giving real size change + parallax
        const swimBounds = pathBounds.clone();
        swimBounds.min.z -= pathSize.z;

        const snow = createMarineSnow(
            scene,
            { min: swimBounds.min.z, max: swimBounds.max.z },
            sharkRadius * 2
        );

        const steering = createSharkSteering({
            shark,
            bounds: swimBounds,
            sharkLength: sharkRadius * 2,
        });

        const fog = new THREE.Fog(WATER_FOG_COLOR, 1, 1000);
        scene.fog = fog;

        const cameraBase = new THREE.Vector3();
        const swayX = pathSize.x * 0.01;
        const swayY = pathSize.y * 0.01;

        // Camera-facing plane through path center turns 2D clicks into 3D destinations
        const clickPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
            new THREE.Vector3(0, 0, 1),
            pathCenter
        );
        const clickPoint = new THREE.Vector3();

        const fitCameraToPath = () => {
            const halfVFov = THREE.MathUtils.degToRad(camera.fov) / 2;
            const halfHFov = Math.atan(Math.tan(halfVFov) * camera.aspect);

            // Distance needed to fit path's height & width, whichever is more limiting
            const distance = Math.max(
                pathSize.y / 2 / Math.tan(halfVFov),
                pathSize.x / 2 / Math.tan(halfHFov)
            );

            // Measure from nearest face of path so closest swim points stay in frame
            camera.position.set(pathCenter.x, pathCenter.y, pathBounds.max.z + distance);
            cameraBase.copy(camera.position);

            // Fog runs from nearest to deepest swim distance, so depth reads as color falloff
            const deepest = (camera.position.z - swimBounds.min.z) * 1.5;
            camera.far = deepest;
            fog.near = distance;
            fog.far = deepest;
        };

        const resizeCanvas = () => {
            if (!globeContainer.offsetWidth || !globeContainer.offsetHeight) return;

            const containerWidth = globeContainer.offsetWidth;
            const containerHeight = globeContainer.offsetHeight;

            // Increase pixel density for clarity (ratio first, so sizes account for it)
            const pixelRatio = getCappedPixelRatio(MAX_PIXEL_RATIO);
            renderer.setPixelRatio(pixelRatio);
            renderer.setSize(containerWidth, containerHeight);

            composer.setPixelRatio(pixelRatio);
            composer.setSize(containerWidth, containerHeight);

            camera.aspect = containerWidth / containerHeight;
            fitCameraToPath();
            camera.updateProjectionMatrix();

            lure.setViewport(renderer.domElement.height, camera.fov);
            snow.fit(camera);
            snow.setViewport(renderer.domElement.height, camera.fov);
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

            console.log(`X: ${mouse.current.x} and Y: ${mouse.current.y}`);

            raycaster.current.setFromCamera(mouse.current, cameraRef.current!);
            const hit = raycaster.current.ray.intersectPlane(clickPlane, clickPoint);

            if (hit) {
                steering.setTarget(clickPoint);
                lure.trigger(clickPoint);
                console.log(clickPoint);

                // // Determine coords, then send up to parent to find nearest shark
                // const lat = Math.asin(normalizedPoint.y / globeRadius) * (180 / Math.PI);
                // const lng = Math.atan2(normalizedPoint.x, normalizedPoint.z) * (180 / Math.PI);

                // console.log(`Clicked at lat: ${lat.toFixed(4)}, lng: ${lng.toFixed(4)}`);
            } else {
                console.log("No intersection with globe.");
            }
        };

        let resizeFrameId = 0;
        const handleResize = () => {
            cancelAnimationFrame(resizeFrameId);
            resizeFrameId = requestAnimationFrame(resizeCanvas);
        };

        window.addEventListener("resize", handleResize);
        globeContainer.addEventListener("click", handleClick);

        const clock = new THREE.Clock();
        let frameId = 0;

        const gustWorld = new THREE.Vector3();
        const lureCore = new THREE.Vector3();

        const tintColor = new THREE.Color();
        const glowTintColor = new THREE.Color();
        let tintHue = 0;
        let tintAmount = 0;

        const sharkNdc = new THREE.Vector3();
        const sharkUv = new THREE.Vector2();
        let sharkGlow = 0;

        const animate = () => {
            // Clamp delta so returning to a backgrounded tab doesn't teleport shark
            const delta = Math.min(clock.getDelta(), 0.1);

            // Shark chases plankton's core, not just where it was clicked
            steering.retarget(lure.getCore(lureCore));
            steering.update(delta);
            const { phase, amplitude } = steering.getRipple();
            animateBody(clock.elapsedTime, phase, amplitude);

            // Shark borrows color of plankton it feeds on, then slowly returns to its rainbow
            const feeding = lure.getFeeding();
            if (feeding > 0.05) {
                if (tintAmount < 0.01) {
                    tintHue = lure.getHue();
                } else {
                    // Shortest way around hue wheel, so new lure blends rather than sweeping
                    let hueDelta = lure.getHue() - tintHue;
                    hueDelta -= Math.round(hueDelta);
                    tintHue = (tintHue + hueDelta * Math.min(1, 3 * delta) + 1) % 1;
                }
            }

            tintAmount +=
                feeding > tintAmount
                    ? (feeding - tintAmount) * Math.min(1, 1.5 * delta)
                    : -tintAmount * Math.min(1, SHARK_TINT_FADE * delta);

            tintColor.setHSL(tintHue, 0.6, 0.74);
            tintPointColors(
                sharkGeometry.attributes.color as THREE.BufferAttribute,
                tintColor,
                tintAmount,
                clock.elapsedTime
            );

            // Water halo takes a dimmer version of the same color
            glowTintColor.copy(tintColor).multiplyScalar(0.5);
            water.setGlowTint(glowTintColor, tintAmount);

            lure.update(
                delta,
                clock.elapsedTime,
                steering.getState(),
                snow.getGustWorld(gustWorld),
                steering.getProximity()
            );
            snow.update(
                clock.elapsedTime,
                shark.position,
                steering.getForward(),
                steering.getSpeedRatio()
            );

            // Slow drift & roll, as if camera were hanging in the current
            const t = clock.elapsedTime;
            camera.position.set(
                cameraBase.x + Math.sin(t * 0.11) * swayX,
                cameraBase.y + Math.sin(t * 0.07 + 1.3) * swayY,
                cameraBase.z
            );
            camera.rotation.z = Math.sin(t * 0.05) * 0.006;
            camera.updateMatrixWorld();

            // Water brightens around shark, more so while it heads for a click
            const glowTarget = steering.getState() === "wander" ? 0.6 : 1;
            sharkGlow += (glowTarget - sharkGlow) * Math.min(1, 2 * delta);

            sharkNdc.copy(shark.position).project(camera);
            sharkUv.set(sharkNdc.x * 0.5 + 0.5, sharkNdc.y * 0.5 + 0.5);
            water.update(
                clock.elapsedTime,
                camera.aspect,
                sharkUv,
                sharkGlow,
                snow.getGustOffset()
            );

            composer.render();
            frameId = requestAnimationFrame(animate);
        };
        animate();

        // Cleanup on component unmount
        return () => {
            cancelAnimationFrame(frameId);
            cancelAnimationFrame(resizeFrameId);
            window.removeEventListener("resize", handleResize);

            // Remove renderer's canvas
            globeContainer.removeEventListener("click", handleClick);

            if (globeContainer.contains(renderer.domElement)) {
                globeContainer.removeChild(renderer.domElement);
            }
            snow.dispose();
            lure.dispose();
            water.dispose();
            disposeObject(scene);
            disposeRenderer(renderer, composer);
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
