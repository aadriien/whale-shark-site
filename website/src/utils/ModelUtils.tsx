import { useEffect } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";


type Point3D = {
    x: number;
    y: number;
    z: number;
}

type Point2D = {
    x: number;
    y: number;
}


const SHARK_MODEL_fantasy = "./models/whale_shark_3D_model_fantasy.glb";


function ExtractPointsOnce() {
    useEffect(() => {
        const loader = new GLTFLoader();

        loader.load(
            SHARK_MODEL_fantasy,
            (gltf) => {
                const vertices3D: Point3D[] = [];

                // Find & omit any unwanted pieces of .glb model from points extraction
                function isExcluded(node: THREE.Object3D | null) {
                    while (node) {
                        if (node.name === "ocean" || node.name === "particles") {
                            return true;
                        }
                        node = node.parent;
                    }
                    return false;
                }

                function isMesh(object: THREE.Object3D): object is THREE.Mesh {
                    return (object as THREE.Mesh).isMesh === true;
                }

                gltf.scene.traverse((child) => {
                    if (isMesh(child) && !isExcluded(child)) {
                        const posAttr = child.geometry.attributes.position;
                        for (let i = 0; i < posAttr.count; i++) {
                            vertices3D.push({
                                x: posAttr.getX(i),
                                y: posAttr.getY(i),
                                z: posAttr.getZ(i),
                            });
                        }
                    }
                });

                // ==== 2D NORMALIZATION ====

                const points2D: Point2D[] = vertices3D.map(({ x, y }) => ({ x, y }));

                const minX2D = Math.min(...points2D.map((p) => p.x));
                const maxX2D = Math.max(...points2D.map((p) => p.x));
                const minY2D = Math.min(...points2D.map((p) => p.y));
                const maxY2D = Math.max(...points2D.map((p) => p.y));

                const rangeX2D = maxX2D - minX2D || 1;
                const rangeY2D = maxY2D - minY2D || 1;

                const normalizedPoints2D: Point2D[] = points2D.map((p) => ({
                    x: (p.x - minX2D) / rangeX2D,
                    y: (p.y - minY2D) / rangeY2D,
                }));


                // ==== 3D NORMALIZATION (preserves aspect ratio using largest axis range) ====

                const minX = Math.min(...vertices3D.map((p) => p.x));
                const maxX = Math.max(...vertices3D.map((p) => p.x));
                const minY = Math.min(...vertices3D.map((p) => p.y));
                const maxY = Math.max(...vertices3D.map((p) => p.y));
                const minZ = Math.min(...vertices3D.map((p) => p.z));
                const maxZ = Math.max(...vertices3D.map((p) => p.z));

                const rangeX = maxX - minX || 1;
                const rangeY = maxY - minY || 1;
                const rangeZ = maxZ - minZ || 1;

                const maxRange = Math.max(rangeX, rangeY, rangeZ);

                const normalizedPoints3D: Point3D[] = vertices3D.map((p) => ({
                    x: (p.x - minX) / maxRange,
                    y: (p.y - minY) / maxRange,
                    z: (p.z - minZ) / maxRange,
                }));


                // Output JSON in console (2D + 3D versions)
                console.log("Normalized 2D Points:");
                console.log(JSON.stringify(normalizedPoints2D));

                console.log("Normalized 3D Points:");
                console.log(JSON.stringify(normalizedPoints3D));
            },
            undefined,
            (error) => {
                    console.error("Error loading model:", error);
            }
        );
    }, []);

    return null;
}

export default ExtractPointsOnce;

