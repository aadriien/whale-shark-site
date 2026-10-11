import * as THREE from "three";

// Blends shark's per-point color buffer toward one tint, after its own animation has written it.
// Lives outside the shark component so other pages using that shark are never affected
export function tintPointColors(
    attribute: THREE.BufferAttribute,
    tint: THREE.Color,
    amount: number,
    time: number
) {
    if (amount <= 0) return;

    const colors = attribute.array as Float32Array;

    for (let i = 0; i < colors.length; i += 3) {
        // Slight per-point shimmer, so tint reads as living color rather than a flat wash
        const mix = amount * (0.8 + 0.2 * Math.sin(i * 0.37 + time * 1.5));

        colors[i] += (tint.r - colors[i]) * mix;
        colors[i + 1] += (tint.g - colors[i + 1]) * mix;
        colors[i + 2] += (tint.b - colors[i + 2]) * mix;
    }

    attribute.needsUpdate = true;
}
