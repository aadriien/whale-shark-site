import React, { useRef, useEffect } from "react";
import p5 from "p5";

import SharkModelPoints from "../assets/data/json/shark_fantasy_model_extracted_points.json";

function GlowingShark() {
    const containerRef = useRef(null);

    // Recreate whale shark by plotting points extracted from 3D model 
    // 3660 total from full .glb, or 2275 for just "WhaleSharkRigging" (no "ocean" or "particles")
    const pointsArray = Object.values(SharkModelPoints);
    const totalDots = pointsArray.length;

    // Precompute min / max for normalization
    const xValues = pointsArray.map(p => p.x);
    const yValues = pointsArray.map(p => p.y);

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    // Add small padding to zoom out so shape doesn't touch edges
    const padding = 0.05;

    // Compute aspect ratio to center properly (preserve proportions)
    const dataWidth = maxX - minX;
    const dataHeight = maxY - minY;
    const dataAspect = dataWidth / dataHeight;

    function normalize(pointX, pointY, canvasAspect) {
        // Normalize X, Y between 0, 1
        const normX = (pointX - minX) / dataWidth;
        const normY = (pointY - minY) / dataHeight;

        if (canvasAspect > dataAspect) {
            // Canvas wider than data, so add horizontal margin
            const scaledWidth = dataAspect / canvasAspect;
            return {
                x: padding + normX * scaledWidth * (1 - 2 * padding) + (1 - scaledWidth) / 2,
                y: padding + normY * (1 - 2 * padding)
            };
        } 
        else {
            // Canvas taller than data, so add vertical margin
            const scaledHeight = canvasAspect / dataAspect;
            return {
                x: padding + normX * (1 - 2 * padding),
                y: padding + normY * scaledHeight * (1 - 2 * padding) + (1 - scaledHeight) / 2
            };
        }
    }

    useEffect(() => {
        let canvasWidth = 0;
        let canvasHeight = 0;

        const sketch = (p) => {
            p.setup = () => {
                canvasWidth = containerRef.current.offsetWidth;
                canvasHeight = containerRef.current.offsetHeight;

                p.createCanvas(canvasWidth, canvasHeight);
                p.colorMode(p.HSB, 360, 100, 100, 100); // HSB easier color control
                p.frameRate(30); // animation speed
            };

            p.draw = () => {
                p.blendMode(p.BLEND);
                p.background(200, 100, 30, 100);

                const canvasAspect = canvasWidth / canvasHeight;

                // Draw all dots to reconstruct shark shape in full
                for (let i = 0; i < totalDots; i++) {
                    const point = pointsArray[i];

                    const { x: normX, y: normY } = normalize(point.x, point.y, canvasAspect);

                    // Stable pulse for glow 
                    const pulse = 0.5 + 0.5 * p.sin(p.millis() / 1000 + i);

                    // Stable hue cycling over time
                    const hue = (360 * (p.millis() / 5000) + i) % 360;

                    drawGlowingDot(normX, normY, pulse, hue);
                }
            };

            const updateCanvasSize = () => {
                if (containerRef.current) {
                    canvasWidth = containerRef.current.offsetWidth;
                    canvasHeight = containerRef.current.offsetHeight;
                    p.resizeCanvas(canvasWidth, canvasHeight);
                }
            };

            const drawGlowingDot = (normX, normY, pulseAmount, hue) => {
                p.blendMode(p.SCREEN);  // SCREEN for glowing additive effect
                p.noStroke();
                
                let posX = normX * canvasWidth;
                let posY = normY * canvasHeight;

                // Increasing size == decreasing opacity for glow layers
                for (let radiusFactor = 0.0; radiusFactor < 0.012; radiusFactor += 0.0015) {
                    // Outer glow (increase brightness with radius)
                    p.fill(hue, 100, radiusFactor * 25, 60);
                    p.circle(posX, posY, canvasWidth * radiusFactor * 0.45);

                    // Inner glow (inverse brightness + pulse with time)
                    p.fill(hue, pulseAmount * 100, (1.0 - radiusFactor) * 30, 60);
                    p.circle(posX, posY, canvasWidth * radiusFactor);
                }
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

