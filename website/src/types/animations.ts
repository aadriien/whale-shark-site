import * as THREE from "three";

/* Animation types */

export type BlobParticleGroupParams = {
    baseColors: THREE.Color[]; 
    particleCount: number;
    spaceScale: number;
    pointSize: number;
    clickableRadius?: number;
    name?: string;
};


type Oscillation = {
    axis1: string;
    amplitude1: number;
    frequency1: number;

    axis2: string;
    amplitude2: number;
    frequency2: number;
};

type Bounds = {
    minX: number;
    maxX: number;

    minY: number;
    maxY: number;

    minZ: number;
    maxZ: number;
};

export type AnimateBlobGroupParams = {
    blobGroup: THREE.Points;
    moveVector?: THREE.Vector3;
    oscillation?: Oscillation;
    bounds?: Bounds;
};


