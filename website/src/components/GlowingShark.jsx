import React, { useRef, useEffect } from "react";
import p5 from "p5";

import SharkModelPoints2D from "../assets/data/json/shark_model_extracted_points_2d.json";
import SharkModelPoints3D from "../assets/data/json/shark_model_extracted_points_3d.json";


function GlowingShark() {
    const containerRef = useRef(null);

    // Recreate whale shark by plotting points extracted from 3D model 
    // 3660 total from full .glb, or 2275 for just "WhaleSharkRigging" (no "ocean" or "particles")
    const rawPoints = Object.values(SharkModelPoints3D);

    // Compute bounds to center & scale shark
    const xs = rawPoints.map(p => p.x);
    const ys = rawPoints.map(p => p.y);
    const zs = rawPoints.map(p => p.z);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const maxSpan = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
    const targetSpan = 500;
    const scaleFactor = targetSpan / maxSpan;

    console.log("Sample point:", rawPoints[0]);

    console.log("Shark bounds:", {
        minX, maxX,
        minY, maxY,
        minZ, maxZ,
        centerX, centerY, centerZ,
        scaleFactor
    });

    // Recenter & scale all points
    const pointsArray = rawPoints.map(p => ({
        x: (p.x - centerX) * scaleFactor,
        y: (p.y - centerY) * scaleFactor,
        z: (p.z - centerZ) * scaleFactor
    }));
    const totalDots = pointsArray.length;

    useEffect(() => {
        let canvasWidth = 0;
        let canvasHeight = 0;

        const sketch = (p) => {
            p.setup = () => {
                canvasWidth = containerRef.current.offsetWidth;
                canvasHeight = containerRef.current.offsetHeight;

                p.createCanvas(canvasWidth, canvasHeight, p.WEBGL); 
                p.colorMode(p.HSB, 360, 100, 100, 100); // HSB easier color control
                p.frameRate(30); // animation speed
            };

            p.draw = () => {
                p.blendMode(p.BLEND);
                p.background(200, 100, 30, 100);

                // p.orbitControl(); // drag to rotate
                p.rotateY(p.millis() * 0.0002); // slow rotation
                p.translate(0, p.sin(p.millis() * 0.001) * 20, 0); // gentle swim-like motion

                drawDebugAxes(p);
                drawDebugOriginDot(p);
                drawBoundingBox(p);

                // Draw all dots to reconstruct shark shape in full
                const stride = 1;
                for (let i = 0; i < totalDots; i += stride) {
                    const point = pointsArray[i];

                    // Stable pulse for glow 
                    const pulse = 0.5 + 0.5 * p.sin(p.millis() / 1000 + i);

                    // Stable hue cycling over time
                    const hue = (360 * (p.millis() / 5000) + i) % 360;

                    // Flip Y for proper orientation in p5 3D
                    drawGlowingDot3D(p, point.x, -point.y, point.z, pulse, hue);
                }
            };

            const updateCanvasSize = () => {
                if (containerRef.current) {
                    canvasWidth = containerRef.current.offsetWidth;
                    canvasHeight = containerRef.current.offsetHeight;
                    p.resizeCanvas(canvasWidth, canvasHeight);
                }
            };

            const drawGlowingDot3D = (p, x, y, z, pulseAmount, hue) => {
                p.push();
                p.translate(x, y, z);
                p.noStroke();
                p.blendMode(p.SCREEN);  // SCREEN for glowing additive effect

                for (let radiusFactor = 0.0; radiusFactor < 0.025; radiusFactor += 0.0025) {
                    // Outer glow (brightness with radius)
                    p.fill(hue, 100, radiusFactor * 200, 100); 
                    p.sphere(p.width * radiusFactor * 0.3, 3);

                    // Inner glow (pulse + inverse brightness)
                    p.fill(hue, pulseAmount * 100, (1.0 - radiusFactor) * 150, 100);
                    p.sphere(p.width * radiusFactor * 0.15, 3);
                }

                p.pop();
            };

            const drawDebugOriginDot = (p) => {
                p.push();
                p.blendMode(p.BLEND);
                p.noStroke();
                p.fill(0, 100, 100); // Bright red dot
                p.translate(0, 0, 0);
                p.sphere(5);
                p.pop();
            };

            const drawBoundingBox = (p) => {
                const boxWidth = (maxX - minX) * scaleFactor;
                const boxHeight = (maxY - minY) * scaleFactor;
                const boxDepth = (maxZ - minZ) * scaleFactor;

                p.push();
                p.blendMode(p.BLEND);
                p.noFill();
                p.stroke(60, 20, 100, 60); // light outline
                p.box(boxWidth, boxHeight, boxDepth);
                p.pop();
            };

            const drawDebugAxes = (p) => {
                const len = 200;
                p.push();
                p.blendMode(p.BLEND);
                p.strokeWeight(2);

                // X axis — red
                p.stroke(0, 100, 100);
                p.line(0, 0, 0, len, 0, 0);

                // Y axis — green
                p.stroke(120, 100, 100);
                p.line(0, 0, 0, 0, -len, 0);

                // Z axis — blue
                p.stroke(240, 100, 100);
                p.line(0, 0, 0, 0, 0, len);

                p.pop();
            };

            p.windowResized = updateCanvasSize;
        };

        const p5Instance = new p5(sketch, containerRef.current);

        const resizeObserver = new ResizeObserver(() => {
            if (p5Instance && p5Instance.resizeCanvas && containerRef.current) {
                const w = containerRef.current.offsetWidth;
                const h = containerRef.current.offsetHeight;
                p5Instance.resizeCanvas(w, h);
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            p5Instance.remove();
            resizeObserver.disconnect();
        };
    }, []);

    return (
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    );
}

export default GlowingShark;
