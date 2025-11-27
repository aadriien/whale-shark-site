/* Three.js types */

declare module "three/examples/jsm/loaders/GLTFLoader" {
    import { Loader, LoadingManager, Group } from "three";
    
    export class GLTFLoader extends Loader {
        constructor(manager?: LoadingManager);
        load(
            url: string,
            onLoad: (gltf: { scene: Group }) => void,
            onProgress?: (event: ProgressEvent<EventTarget>) => void,
            onError?: (event: ErrorEvent) => void
        ): void;
    }
}


declare module "three/examples/jsm/controls/OrbitControls" {
    import { EventDispatcher, Camera, MOUSE, TOUCH, Vector3 } from "three";
    
    export class OrbitControls extends EventDispatcher {
        constructor(object: Camera, domElement?: HTMLElement);
        
        enabled: boolean;
        target: Vector3;
        minDistance: number;
        maxDistance: number;
        minZoom: number;
        maxZoom: number;
        
        rotateSpeed: number;
        zoomSpeed: number;
        panSpeed: number;
        screenSpacePanning: boolean;
        enableDamping: boolean;
        dampingFactor: number;
        
        enableZoom: boolean;
        enableRotate: boolean;
        enablePan: boolean;
        enableKeys: boolean;
        keys: { LEFT: string; UP: string; RIGHT: string; BOTTOM: string };
        mouseButtons: { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE };
        touches: { ONE: TOUCH; TWO: TOUCH };
        
        update(): void;
        dispose(): void;
        reset(): void;
        saveState(): void;
        restoreState(): void;
    }
}



