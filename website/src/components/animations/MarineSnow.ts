import * as THREE from "three";

const PARTICLE_COUNT = 2500;

// Drift is in volume fractions per second, so it scales with whatever space is filled.
// Wrapping & wake are computed per-particle in shader from time + shark uniforms alone,
// so there's no CPU loop & motion is a pure function of time (no state to stutter)
const snowVertexShader = `
    attribute vec3 aBase;
    attribute float aSeed;

    uniform float uTime;
    uniform vec3 uMin;
    uniform vec3 uSize;
    uniform vec3 uShark;
    uniform vec3 uDir;
    uniform float uSpeed;
    uniform float uReach;
    uniform float uPixelScale;

    varying float vAlpha;

    void main() {
        vec3 p = aBase;

        vec3 drift = vec3(0.010, -0.018, 0.004) * (0.6 + aSeed * 0.8);
        p += drift * uTime;
        p.x += sin(uTime * 0.3 + aSeed * 30.0) * 0.012;
        p.y += cos(uTime * 0.25 + aSeed * 17.0) * 0.010;
        p = fract(p);

        // Fade at volume edges so wrapping never pops
        vec3 lo = smoothstep(vec3(0.0), vec3(0.06), p);
        vec3 hi = 1.0 - smoothstep(vec3(0.94), vec3(1.0), p);
        float edge = lo.x * lo.y * lo.z * hi.x * hi.y * hi.z;

        vec3 world = uMin + p * uSize;

        // Wake: capsule trailing behind shark, pushing specks outward & swirling them
        vec3 tail = uShark - uDir * uReach * 2.0;
        vec3 ab = uShark - tail;
        float h = clamp(dot(world - tail, ab) / dot(ab, ab), 0.0, 1.0);
        vec3 away = world - (tail + ab * h);
        float dist = length(away);

        float influence = exp(-(dist * dist) / (uReach * uReach));
        influence *= mix(0.35, 1.0, h) * (0.4 + 0.6 * uSpeed);

        vec3 outward = away / max(dist, 0.001);
        vec3 swirl = cross(uDir, outward);
        float phase = uTime * 2.0 + h * 6.0 + aSeed * 6.2831853;

        world += (outward * 0.35 + swirl * sin(phase) * 0.5) * influence * uReach * 0.5;

        vec4 mvPosition = modelViewMatrix * vec4(world, 1.0);
        gl_PointSize = uPixelScale * (0.5 + aSeed) / -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;

        // Distant specks dimmer, specks in shark's wake catch its light
        float depthFade = 0.35 + 0.65 * p.z;
        vAlpha = edge * depthFade * (0.35 + 0.9 * influence);
    }
`;

const snowFragmentShader = `
    varying float vAlpha;

    void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        float soft = smoothstep(0.5, 0.0, dist);

        gl_FragColor = vec4(vec3(0.70, 0.90, 1.0), soft * soft * vAlpha);
    }
`;

export function createMarineSnow(
    scene: THREE.Scene,
    zRange: { min: number; max: number },
    sharkLength: number
) {
    const uniforms = {
        uTime: { value: 0 },
        uMin: { value: new THREE.Vector3() },
        uSize: { value: new THREE.Vector3(1, 1, 1) },
        uShark: { value: new THREE.Vector3() },
        uDir: { value: new THREE.Vector3(1, 0, 0) },
        uSpeed: { value: 0 },
        uReach: { value: sharkLength * 0.6 },
        uPixelScale: { value: 1 },
    };

    const bases = new Float32Array(PARTICLE_COUNT * 3);
    const seeds = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        bases[i * 3] = Math.random();
        bases[i * 3 + 1] = Math.random();
        bases[i * 3 + 2] = Math.random();
        seeds[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(PARTICLE_COUNT * 3), 3)
    );
    geometry.setAttribute("aBase", new THREE.BufferAttribute(bases, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const material = new THREE.ShaderMaterial({
        vertexShader: snowVertexShader,
        fragmentShader: snowFragmentShader,
        uniforms,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = -10;
    scene.add(points);

    // Fill whatever camera sees at the far end of range, so edges never show gaps
    const fit = (camera: THREE.PerspectiveCamera) => {
        const halfHeight =
            Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * (camera.position.z - zRange.min);
        const halfWidth = halfHeight * camera.aspect;

        uniforms.uMin.value.set(
            camera.position.x - halfWidth,
            camera.position.y - halfHeight,
            zRange.min
        );
        uniforms.uSize.value.set(halfWidth * 2, halfHeight * 2, zRange.max - zRange.min);
    };

    const setViewport = (heightPx: number, fovDegrees: number) => {
        const pixelsPerUnit = heightPx / (2 * Math.tan(THREE.MathUtils.degToRad(fovDegrees) / 2));
        uniforms.uPixelScale.value = pixelsPerUnit * sharkLength * 0.015;
    };

    const update = (
        time: number,
        sharkPosition: THREE.Vector3,
        sharkForward: THREE.Vector3,
        speedRatio: number
    ) => {
        uniforms.uTime.value = time;
        uniforms.uShark.value.copy(sharkPosition);
        uniforms.uDir.value.copy(sharkForward);
        uniforms.uSpeed.value = speedRatio;
    };

    const dispose = () => {
        geometry.dispose();
        material.dispose();
    };

    return { fit, setViewport, update, dispose };
}
