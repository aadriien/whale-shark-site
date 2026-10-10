import * as THREE from "three";

// Exponent applied to water color on output. Note that 2.2 reproduces authored colors exactly
// (deep, near-black trenches); lower values lift darks toward a hazier open ocean (1.0 = baby blue)
const WATER_GAMMA = 1.8;

// Mid-depth water color as it lands in linear space, so fog fades objects into the water
export const WATER_FOG_COLOR = new THREE.Color(
    0,
    Math.pow(0.13, WATER_GAMMA),
    Math.pow(0.28, WATER_GAMMA)
);

// Full-screen quad that ignores camera, so water fills viewport regardless of shark framing
const waterVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 1.0, 1.0);
    }
`;

const waterFragmentShader = `
    uniform float uTime;
    uniform float uAspect;
    uniform vec2 uShark;
    uniform float uSharkGlow;
    uniform vec2 uCurrent;
    varying vec2 vUv;

    float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
        );
    }

    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p = p * 2.03 + vec2(17.1, 9.2);
            a *= 0.5;
        }
        return v;
    }

    // Bright ridges where noise crosses 0.5, which reads as refracted light
    float causticLayer(vec2 p, vec2 drift) {
        float n = noise(p + drift);
        return pow(1.0 - abs(n * 2.0 - 1.0), 8.0);
    }

    void main() {
        vec2 uv = vUv;
        vec2 p = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);

        // Depth: abyss at bottom, sunlit teal near surface
        vec3 deep = vec3(0.0, 0.025, 0.10);
        vec3 mid = vec3(0.0, 0.13, 0.28);
        vec3 shallow = vec3(0.08, 0.42, 0.60);

        vec3 col = mix(deep, mid, smoothstep(0.0, 0.6, uv.y));
        col = mix(col, shallow, pow(smoothstep(0.55, 1.0, uv.y), 1.5) * 0.7);

        // Slow drifting murk, carried along by gusts
        float murk = fbm(p * 1.2 + vec2(uTime * 0.02, -uTime * 0.015) - uCurrent * 2.0);
        col += vec3(0.02, 0.07, 0.10) * murk;

        // Light shafts fanning from a point above the screen, bent by noise
        vec2 source = vec2(0.15 * sin(uTime * 0.05), 0.85);
        vec2 toPixel = p - source;
        float angle = atan(toPixel.x, -toPixel.y);

        float shafts = noise(vec2(angle * 7.0 + uTime * 0.05, uTime * 0.03)) * 0.6
                     + noise(vec2(angle * 15.0 - uTime * 0.04, 3.0)) * 0.4;
        shafts = smoothstep(0.45, 0.9, shafts);

        // Each shaft breathes on its own, as surface swell passes overhead
        shafts *= 0.65 + 0.7 * noise(vec2(angle * 4.0 + 7.0, uTime * 0.35));

        // Overall surface light wavers gently, from incommensurate slow sines so it never repeats
        float flicker = 1.0 + 0.12 * sin(uTime * 0.9)
                            + 0.08 * sin(uTime * 1.7 + 2.1)
                            + 0.05 * sin(uTime * 3.1 + 0.6);

        float reach = exp(-length(toPixel) * 1.5);
        col += vec3(0.14, 0.38, 0.48) * shafts * reach * 0.7 * flicker;

        // Caustic shimmer, strongest near surface
        float caustics = causticLayer(p * 5.0, vec2(uTime * 0.10, uTime * 0.07))
                       + causticLayer(p * 8.0, vec2(-uTime * 0.08, uTime * 0.11));
        col += vec3(0.10, 0.30, 0.38) * caustics * 0.18 * flicker * smoothstep(0.25, 1.0, uv.y);

        // Shark lights the water around itself
        vec2 sharkP = vec2((uShark.x - 0.5) * uAspect, uShark.y - 0.5);
        float sharkDist = distance(p, sharkP);
        col += vec3(0.10, 0.34, 0.55) * exp(-sharkDist * sharkDist * 14.0) * uSharkGlow;

        col *= 1.0 - clamp(dot(p, p) * 0.8, 0.0, 0.7);

        // Dither to hide banding in dark gradients
        col += (hash(gl_FragCoord.xy + uTime) - 0.5) / 255.0;

        // Composer's final pass sRGB-encodes frame, so hand it linear to land on authored colors
        gl_FragColor = vec4(pow(col, vec3(${WATER_GAMMA.toFixed(2)})), 1.0);
    }
`;

export function createWaterVolume(scene: THREE.Scene) {
    const material = new THREE.ShaderMaterial({
        vertexShader: waterVertexShader,
        fragmentShader: waterFragmentShader,
        depthTest: false,
        depthWrite: false,
        uniforms: {
            uTime: { value: 0 },
            uAspect: { value: 1 },
            uShark: { value: new THREE.Vector2(0.5, 0.5) },
            uSharkGlow: { value: 0 },
            uCurrent: { value: new THREE.Vector2() },
        },
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    mesh.frustumCulled = false;
    mesh.renderOrder = -1000;
    scene.add(mesh);

    // sharkUv is shark's position in 0..1 screen space, current is accumulated gust offset
    const update = (
        time: number,
        aspect: number,
        sharkUv: THREE.Vector2,
        sharkGlow: number,
        current: THREE.Vector3
    ) => {
        material.uniforms.uTime.value = time;
        material.uniforms.uAspect.value = aspect;
        material.uniforms.uShark.value.copy(sharkUv);
        material.uniforms.uSharkGlow.value = sharkGlow;
        material.uniforms.uCurrent.value.set(current.x, current.y);
    };

    const dispose = () => {
        mesh.geometry.dispose();
        material.dispose();
    };

    return { update, dispose };
}
