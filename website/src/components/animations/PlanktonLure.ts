import * as THREE from "three";

import { SharkSteeringState } from "../../types/animations";

const PARTICLE_COUNT = 220;
const RING_SECONDS = 0.9;

// Ring is drawn on a camera-facing plane slightly larger than its max radius
const PLANE_PADDING = 1.2;

// Particles start spread around the expanding ring, then condense into a drifting blob
const lureVertexShader = `
    attribute vec3 aOffset;
    attribute float aSeed;

    uniform float uTime;
    uniform float uAge;
    uniform float uPresence;
    uniform float uLinger;
    uniform float uRadius;
    uniform float uRingSeconds;
    uniform float uPixelScale;

    varying float vAlpha;
    varying float vMix;

    void main() {
        float angle = aSeed * 6.2831853;

        float ringT = clamp(uAge / uRingSeconds, 0.0, 1.0);
        float ringRadius = (1.0 - pow(1.0 - ringT, 3.0)) * uRadius;
        vec3 ringPos = vec3(cos(angle), sin(angle), 0.0) * ringRadius;

        float swirl = uTime * (0.3 + aSeed * 0.4) + aSeed * 20.0;
        vec3 blobPos = aOffset * uRadius * 0.6;
        blobPos.x += sin(swirl + aOffset.y * 3.0) * uRadius * 0.08;
        blobPos.y += cos(swirl * 0.8 + aOffset.z * 3.0) * uRadius * 0.08;
        blobPos.z += sin(swirl * 1.1 + aOffset.x * 3.0) * uRadius * 0.08;

        // Blob draws inward while shark feeds
        blobPos *= 1.0 - 0.35 * uLinger;

        float morph = smoothstep(uRingSeconds * 0.55, uRingSeconds * 2.0, uAge);
        vec4 mvPosition = modelViewMatrix * vec4(mix(ringPos, blobPos, morph), 1.0);

        float twinkle = 0.6 + 0.4 * sin(uTime * 2.0 + aSeed * 40.0);

        gl_PointSize = uPixelScale * (0.6 + aSeed * 0.8) * (1.0 + 0.6 * uLinger) / -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;

        vAlpha = uPresence * twinkle * (0.6 + 0.4 * uLinger);
        vMix = aSeed;
    }
`;

const lureFragmentShader = `
    varying float vAlpha;
    varying float vMix;

    void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        float soft = smoothstep(0.5, 0.0, dist);

        vec3 color = mix(vec3(0.25, 0.85, 1.0), vec3(0.55, 1.0, 0.75), vMix);
        gl_FragColor = vec4(color, soft * soft * vAlpha);
    }
`;

const ringVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Two staggered rings, fading out as the particles condense into the blob
const ringFragmentShader = `
    uniform float uAge;
    uniform float uPresence;
    uniform float uRingSeconds;
    uniform float uRingMax;
    varying vec2 vUv;

    float ringAt(float r, float age) {
        float t = clamp(age / uRingSeconds, 0.0, 1.0);
        float ringRadius = (1.0 - pow(1.0 - t, 3.0)) * uRingMax;
        float thickness = 0.015 + 0.03 * t;
        float x = (r - ringRadius) / thickness;
        return exp(-x * x) * (1.0 - t * 0.6);
    }

    void main() {
        float r = length(vUv - vec2(0.5)) * 2.0;

        float rings = ringAt(r, uAge) + 0.5 * ringAt(r, uAge - 0.25);
        float fade = 1.0 - smoothstep(uRingSeconds * 0.55, uRingSeconds * 1.8, uAge);

        vec3 color = vec3(0.45, 0.9, 1.0);
        gl_FragColor = vec4(color, rings * fade * uPresence);
    }
`;

export function createPlanktonLure(scene: THREE.Scene, radius: number) {
    const uniforms = {
        uTime: { value: 0 },
        uAge: { value: 0 },
        uPresence: { value: 0 },
        uLinger: { value: 0 },
        uRadius: { value: radius },
        uRingSeconds: { value: RING_SECONDS },
        uPixelScale: { value: 1 },
        uRingMax: { value: 1 / PLANE_PADDING },
    };

    const group = new THREE.Group();
    group.visible = false;
    scene.add(group);

    const offsets = new Float32Array(PARTICLE_COUNT * 3);
    const seeds = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        let x: number, y: number, z: number;
        do {
            x = Math.random() * 2 - 1;
            y = Math.random() * 2 - 1;
            z = Math.random() * 2 - 1;
        } while (x * x + y * y + z * z > 1);

        offsets[i * 3] = x;
        offsets[i * 3 + 1] = y;
        offsets[i * 3 + 2] = z;
        seeds[i] = Math.random();
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(PARTICLE_COUNT * 3), 3)
    );
    particleGeometry.setAttribute("aOffset", new THREE.BufferAttribute(offsets, 3));
    particleGeometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const particleMaterial = new THREE.ShaderMaterial({
        vertexShader: lureVertexShader,
        fragmentShader: lureFragmentShader,
        uniforms,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.frustumCulled = false;
    group.add(particles);

    const ringGeometry = new THREE.PlaneGeometry(2, 2);
    const ringMaterial = new THREE.ShaderMaterial({
        vertexShader: ringVertexShader,
        fragmentShader: ringFragmentShader,
        uniforms,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
    });

    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.scale.setScalar(radius * PLANE_PADDING);
    ring.frustumCulled = false;
    group.add(ring);

    const pending = new THREE.Vector3();
    let hasPending = false;

    let age = 0;
    let presence = 0;
    let linger = 0;

    // Relocating is deferred until the previous lure has faded, so particles never snap
    const trigger = (point: THREE.Vector3) => {
        pending.copy(point);
        hasPending = true;
    };

    const update = (delta: number, time: number, state: SharkSteeringState) => {
        const wanted = hasPending || state === "wander" ? 0 : 1;
        const rate = hasPending ? 12 : wanted ? 4 : 1.5;
        presence += (wanted - presence) * Math.min(1, rate * delta);

        if (hasPending && presence < 0.02) {
            group.position.copy(pending);
            age = 0;
            hasPending = false;
        }

        linger += ((state === "linger" ? 1 : 0) - linger) * Math.min(1, 2 * delta);
        age += delta;

        uniforms.uTime.value = time;
        uniforms.uAge.value = age;
        uniforms.uPresence.value = presence;
        uniforms.uLinger.value = linger;

        group.visible = presence > 0.001;
    };

    // Particle size is a fraction of lure radius, converted to pixels for current viewport
    const setViewport = (heightPx: number, fovDegrees: number) => {
        const pixelsPerUnit = heightPx / (2 * Math.tan(THREE.MathUtils.degToRad(fovDegrees) / 2));
        uniforms.uPixelScale.value = pixelsPerUnit * radius * 0.15;
    };

    const dispose = () => {
        particleGeometry.dispose();
        particleMaterial.dispose();
        ringGeometry.dispose();
        ringMaterial.dispose();
    };

    return { trigger, update, setViewport, dispose };
}
