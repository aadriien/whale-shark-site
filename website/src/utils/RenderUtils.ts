import * as THREE from "three";
import type { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";

export function getCappedPixelRatio(maxRatio: number) {
    return Math.min(window.devicePixelRatio, maxRatio);
}

export function disposeObject(root: THREE.Object3D) {
    root.traverse((object) => {
        const renderable = object as THREE.Mesh;
        renderable.geometry?.dispose();

        const materials = Array.isArray(renderable.material)
            ? renderable.material
            : [renderable.material];

        materials.forEach((material) => {
            if (!material) return;

            Object.values(material).forEach((value) => {
                if (value instanceof THREE.Texture) value.dispose();
            });
            material.dispose();
        });
    });
}

export function disposeRenderer(renderer: THREE.WebGLRenderer, composer?: EffectComposer) {
    composer?.passes.forEach((pass) => pass.dispose?.());
    composer?.dispose();

    renderer.dispose();

    // Browsers cap WebGL contexts (GPU slots) from 3D scenes at ~16, so release its
    // slot now rather than waiting on garbage collector to clean up later
    renderer.forceContextLoss();
}
