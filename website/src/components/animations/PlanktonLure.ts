import * as THREE from "three";

import { SharkSteeringState } from "../../types/animations";

const PARTICLE_COUNT = 220;
const RING_SECONDS = 0.9;

// Ring is drawn on a camera-facing plane slightly larger than its max radius
const PLANE_PADDING = 1.2;

// Share of ocean gust displacement felt by lure (lighter than the specks around it)
const GUST_COUPLING = 0.5;

// Each click shifts hue by this much, so consecutive lures are clearly different colors
const HUE_STEP = { min: 0.15, max: 0.5 };

// Soft pastel from a hue, with per-particle hue spread & the odd accent speck, like a coral bed
const pastelShader = `
    vec3 hsl2rgb(vec3 c) {
        vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
        return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
    }

    vec3 pastel(float hue, float seed) {
        float accent = step(0.82, fract(seed * 5.3)) * 0.14;
        float h = fract(hue + (seed - 0.5) * 0.12 + accent);
        return hsl2rgb(vec3(h, 0.6, 0.74));
    }
`;

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
    uniform vec3 uDrift;

    varying float vAlpha;
    varying float vMix;

    void main() {
        float angle = aSeed * 6.2831853;

        float ringT = clamp(uAge / uRingSeconds, 0.0, 1.0);
        float ringRadius = (1.0 - pow(1.0 - ringT, 3.0)) * uRadius;
        vec3 ringPos = vec3(cos(angle), sin(angle), 0.0) * ringRadius;

        // Layered slow flow, so blob churns like a small eddy instead of orbiting in lockstep
        float t = uTime * (0.25 + aSeed * 0.3);
        vec3 flow = vec3(
            sin(t + aOffset.y * 3.0 + aSeed * 20.0) + 0.5 * sin(t * 2.3 + aOffset.z * 5.0),
            cos(t * 0.8 + aOffset.z * 3.0 + aSeed * 11.0) + 0.5 * cos(t * 1.9 + aOffset.x * 5.0),
            sin(t * 1.1 + aOffset.x * 3.0 + aSeed * 7.0) + 0.5 * sin(t * 2.1 + aOffset.y * 5.0)
        );

        vec3 blobPos = aOffset * uRadius * 0.6;
        blobPos += flow * uRadius * 0.07;

        // Slow breathing, out of phase across the blob
        blobPos *= 1.0 + 0.07 * sin(uTime * 0.55 + dot(aOffset, vec3(1.0)) * 2.0);

        // Blob draws inward while shark feeds
        blobPos *= 1.0 - 0.35 * uLinger;

        // Strays peel away on a gentle current the longer blob goes unvisited,
        // then are drawn back once shark arrives to feed
        float stray = smoothstep(0.5, 1.0, fract(aSeed * 7.31));
        float unvisited = 1.0 - exp(-max(uAge - uRingSeconds * 2.0, 0.0) * 0.06);
        float strayAmount = stray * unvisited * (1.0 - uLinger);

        vec3 current = normalize(vec3(0.8 + aOffset.x * 0.5, aOffset.y * 0.5, aOffset.z * 0.4));
        blobPos += current * uRadius * 1.2 * strayAmount;

        // Unvisited blob slowly stretches along the current & sinks, like it's loosening
        blobPos.x *= 1.0 + 0.4 * unvisited * (1.0 - uLinger);
        blobPos.y -= uRadius * 0.12 * unvisited * (1.0 - uLinger);

        // Ocean gusts carry lure, each speck by a different amount so blob smears & disperses
        float carried = 0.4 + 0.8 * fract(aSeed * 3.7);
        blobPos += uDrift * carried;

        float morph = smoothstep(uRingSeconds * 0.55, uRingSeconds * 2.0, uAge);
        vec4 mvPosition = modelViewMatrix * vec4(mix(ringPos, blobPos, morph), 1.0);

        float twinkle = 0.6 + 0.4 * sin(uTime * 2.0 + aSeed * 40.0);

        gl_PointSize = uPixelScale * (0.6 + aSeed * 0.8) * (1.0 + 0.6 * uLinger) / -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;

        vAlpha = uPresence * twinkle * (0.6 + 0.4 * uLinger) * (1.0 - 0.5 * strayAmount);
        vMix = aSeed;
    }
`;

const lureFragmentShader = `
    uniform float uHue;

    varying float vAlpha;
    varying float vMix;

    ${pastelShader}

    void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        float soft = smoothstep(0.5, 0.0, dist);

        vec3 color = pastel(uHue, vMix);
        gl_FragColor = vec4(pow(color, vec3(2.2)), soft * soft * vAlpha);
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
    uniform float uHue;
    varying vec2 vUv;

    ${pastelShader}

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

        vec3 color = pow(pastel(uHue, 0.5), vec3(2.2));
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
        uHue: { value: Math.random() },
        uDrift: { value: new THREE.Vector3() },
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
    const gustBaseline = new THREE.Vector3();
    let hasPending = false;

    let age = 0;
    let presence = 0;
    let linger = 0;

    // Relocating is deferred until the previous lure has faded, so particles never snap
    const trigger = (point: THREE.Vector3) => {
        pending.copy(point);
        hasPending = true;
    };

    // gustDisplacement is accumulated ocean current in world units
    const update = (
        delta: number,
        time: number,
        state: SharkSteeringState,
        gustDisplacement: THREE.Vector3
    ) => {
        const wanted = hasPending || state === "wander" ? 0 : 1;
        const rate = hasPending ? 12 : wanted ? 4 : 1.5;
        presence += (wanted - presence) * Math.min(1, rate * delta);

        if (hasPending && presence < 0.02) {
            group.position.copy(pending);
            gustBaseline.copy(gustDisplacement);

            // New color is chosen while lure is invisible, so it never visibly changes mid-life
            uniforms.uHue.value =
                (uniforms.uHue.value + THREE.MathUtils.randFloat(HUE_STEP.min, HUE_STEP.max)) % 1;

            age = 0;
            hasPending = false;
        }

        linger += ((state === "linger" ? 1 : 0) - linger) * Math.min(1, 2 * delta);
        age += delta;

        uniforms.uTime.value = time;
        uniforms.uAge.value = age;
        uniforms.uPresence.value = presence;
        uniforms.uLinger.value = linger;
        uniforms.uDrift.value
            .copy(gustDisplacement)
            .sub(gustBaseline)
            .multiplyScalar(GUST_COUPLING);

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
