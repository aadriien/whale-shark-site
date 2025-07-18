import React, { useRef, useEffect } from "react";
import p5 from "p5";


function GlowingShark() {
    const containerRef = useRef(null);

    const totalDots = 30;


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
                // Normalized frame ratio to loop every 900 frames (~30 sec)
                const animationProgress = (p.frameCount % 900) / 900;

                p.blendMode(p.BLEND);
                p.background(200, 100, 30, 100);

                for (let i = 0; i < totalDots; i++) {
                    // Adjust animation progress per dot 
                    const phaseOffset = i / totalDots;
                    const dotProgress = (animationProgress + phaseOffset) % 1;

                    // Time-based animation factor per dot (sin + noise for pulsing)
                    const pulse = p.sin(p.PI * ((dotProgress + p.noise(30, i)) % 1));
                    
                    // Dot hue changes over time (+ noise randomness)
                    const hue = (360 * dotProgress + p.noise(50, i) * 240) % 360;

                    drawGlowingDot(i / totalDots, p.noise(i * 10, i), pulse, hue);
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
                for (let radiusFactor = 0.0; radiusFactor < 0.2; radiusFactor += 0.004) {
                    // Outer glow (increase brightness with radius)
                    p.fill(hue, 100, radiusFactor * 3, 100); 
                    p.circle(posX, posY, canvasWidth * radiusFactor * 0.5);

                    // Inner glow (inverse brightness + pulse with time)
                    p.fill(hue, pulseAmount * 100, (1.0 - radiusFactor) * 3, 100);
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

