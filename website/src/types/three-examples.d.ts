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


