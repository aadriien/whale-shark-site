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


export type SegmentDataItem = {
    segmentIndex: number;
    segmentPos: number;
};

export type SegmentData = SegmentDataItem[];


type Axes = "x" | "y" | "z";

type Mode = "simple" | "segmented" | "smooth";

export type WaveProps = {
    basePositions: Float32Array<ArrayBuffer>;
    time: number;
    wavelength: number;
    speed: number;
};

export type ApplyRippleProps = WaveProps & {
    positions: Float32Array<ArrayBuffer>;
    axis: Axes;
    amplitude: number;
    numSegments: number;
    taperPower: number;
    taperStart: number;
    mode: Mode;
};


export type GalacticOceanProps = {
    isMobile: boolean;
};


export type HoverBlobName = "reef" | "current";

type BlobConfigs = {
    opacity: number;
    size: number;
};

type ParticleBlob = {
    blob: THREE.Points;
    original: BlobConfigs;
};

export type ParticleBlobs = Record<HoverBlobName, ParticleBlob>;


export type SetActiveBlobProps = {
    particleBlobs: ParticleBlobs;
    activeName?: HoverBlobName;
    sourceObject?: THREE.Object3D;
};


