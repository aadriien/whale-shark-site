import { useEffect } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";


function ExtractPointsOnce() {
    useEffect(() => {
        const loader = new GLTFLoader();

        loader.load(
            "./models/whale_shark_3D_model_fantasy.glb",
            (gltf) => {
                const vertices3D = [];

                // Find & omit any unwanted pieces of .glb model from points extraction
                function isExcluded(node) {
                    while (node) {
                        if (node.name === "ocean" || node.name === "particles") {
                            return true;
                        }
                        node = node.parent;
                    }
                    return false;
                }

                gltf.scene.traverse((child) => {
                    if (child.isMesh && !isExcluded(child)) {
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

                const points2D = vertices3D.map(({ x, y }) => ({ x, y }));

                const minX = Math.min(...points2D.map((p) => p.x));
                const maxX = Math.max(...points2D.map((p) => p.x));
                const minY = Math.min(...points2D.map((p) => p.y));
                const maxY = Math.max(...points2D.map((p) => p.y));

                const rangeX = maxX - minX || 1;
                const rangeY = maxY - minY || 1;

                const normalizedPoints = points2D.map((p) => ({
                    x: (p.x - minX) / rangeX,
                    y: (p.y - minY) / rangeY,
                }));

                // Output JSON in console - copy from there!
                console.log(JSON.stringify(normalizedPoints));
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
