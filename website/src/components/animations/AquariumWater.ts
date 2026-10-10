import * as THREE from "three";

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

        // Slow drifting murk
        float murk = fbm(p * 1.2 + vec2(uTime * 0.02, -uTime * 0.015));
        col += vec3(0.02, 0.07, 0.10) * murk;

        // Light shafts fanning from a point above the screen, bent by noise
        vec2 source = vec2(0.15 * sin(uTime * 0.05), 0.85);
        vec2 toPixel = p - source;
        float angle = atan(toPixel.x, -toPixel.y);

        float shafts = noise(vec2(angle * 7.0 + uTime * 0.05, uTime * 0.03)) * 0.6
                     + noise(vec2(angle * 15.0 - uTime * 0.04, 3.0)) * 0.4;
        shafts = smoothstep(0.45, 0.9, shafts);

        float reach = exp(-length(toPixel) * 1.5);
        col += vec3(0.14, 0.38, 0.48) * shafts * reach * 0.7;

        // Caustic shimmer, strongest near surface
        float caustics = causticLayer(p * 5.0, vec2(uTime * 0.10, uTime * 0.07))
                       + causticLayer(p * 8.0, vec2(-uTime * 0.08, uTime * 0.11));
        col += vec3(0.10, 0.30, 0.38) * caustics * 0.18 * smoothstep(0.25, 1.0, uv.y);

        // Shark lights the water around itself
        vec2 sharkP = vec2((uShark.x - 0.5) * uAspect, uShark.y - 0.5);
        float sharkDist = distance(p, sharkP);
        col += vec3(0.10, 0.34, 0.55) * exp(-sharkDist * sharkDist * 14.0) * uSharkGlow;

        col *= 1.0 - clamp(dot(p, p) * 0.8, 0.0, 0.7);

        // Dither to hide banding in dark gradients
        col += (hash(gl_FragCoord.xy + uTime) - 0.5) / 255.0;

        gl_FragColor = vec4(col, 1.0);
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
        },
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    mesh.frustumCulled = false;
    mesh.renderOrder = -1000;
    scene.add(mesh);

    // sharkUv is shark's position in 0..1 screen space
    const update = (time: number, aspect: number, sharkUv: THREE.Vector2, sharkGlow: number) => {
        material.uniforms.uTime.value = time;
        material.uniforms.uAspect.value = aspect;
        material.uniforms.uShark.value.copy(sharkUv);
        material.uniforms.uSharkGlow.value = sharkGlow;
    };

    const dispose = () => {
        mesh.geometry.dispose();
        material.dispose();
    };

    return { update, dispose };
}
