import * as THREE from "three";

import SharkModelPoints3D from "../assets/data/json/shark_model_extracted_points_3d.json";


function computeWave(basePositions, time, wavelength, speed) {
    const waveValues = new Float32Array(basePositions.length / 3);

    for (let i = 0; i < basePositions.length / 3; i++) {
        // Use Y axis to run wave lengthwise
        const y = basePositions[i * 3 + 1]; 
        waveValues[i] = Math.sin(y * wavelength + time * speed);
    }
    return waveValues;
}


function computeSegments(basePositions, numSegments) {
    let minY = Infinity, maxY = -Infinity;

    for (let i = 0; i < basePositions.length / 3; i++) {
        // Use Y axis to segment body lengthwise
        const y = basePositions[i * 3 + 1];
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }
    const segmentSize = (maxY - minY) / numSegments;
    
    // Assign each point to segment index & fractional position in segment
    const segmentData = new Array(basePositions.length / 3);
    for (let i = 0; i < basePositions.length / 3; i++) {
        const y = basePositions[i * 3 + 1];

        const floatSegment = (y - minY) / segmentSize;
        const segmentIndex = Math.min(Math.floor(floatSegment), numSegments - 1);
        const segmentPos = floatSegment - segmentIndex;

        segmentData[i] = { segmentIndex, segmentPos };
    }
    return { minY, maxY, segmentSize, segmentData };
}


function applyRipple({
    positions,
    basePositions,
    time,
    axis = "x",
    amplitude = 20,
    wavelength = 0.02,
    speed = 4,
    numSegments = 20,
    taperPower = 2,
    taperStart = 0.5, // start taper at halfway point
    mode = "smooth", // "simple", "segmented", "smooth"
}) {
    const axisIndex = { x: 0, y: 1, z: 2 }[axis];
    if (axisIndex === undefined) return;
    
    const pointCount = basePositions.length / 3;
    
    // Compute wave values & body segments based on Y axis
    const waveValues = computeWave(basePositions, time, wavelength, speed);
    const { minY, maxY, segmentSize, segmentData } = computeSegments(basePositions, numSegments);
    
    // Precompute segment ripple offsets with taper flipped (tail = higher Y)
    const segmentOffsets = new Array(numSegments).fill(0);
    if (mode !== "simple") {
        for (let i = 0; i < numSegments; i++) {
            const segmentY = minY + i * segmentSize + segmentSize / 2;
            const normSegment = 1 - (segmentY - minY) / (maxY - minY); // flipped: 0 = tail, 1 = head
            let taper = 0;

            if (normSegment > taperStart) {
                taper = Math.pow((normSegment - taperStart) / (1 - taperStart), taperPower);
            }
            const phase = segmentY * wavelength + time * speed;
            segmentOffsets[i] = amplitude * taper * Math.sin(phase);
        }
    }
    
    for (let i = 0; i < pointCount; i++) {
        const baseX = basePositions[i * 3];
        const baseY = basePositions[i * 3 + 1];
        const baseZ = basePositions[i * 3 + 2];
        
        // Flipped normalized Y (0 = tail, 1 = head)
        const normY = 1 - (baseY - minY) / (maxY - minY);
        let ripple = 0;
        
        switch (mode) {
            case "simple":
                let taperSimple = 0;
                if (normY > taperStart) {
                    taperSimple = Math.pow((normY - taperStart) / (1 - taperStart), taperPower);
                }
                ripple = amplitude * taperSimple * waveValues[i];
                break;
            
            case "segmented":
                const segIndex = segmentData[i].segmentIndex;
                ripple = segmentOffsets[segIndex] || 0;
                break;
            
            case "smooth":
                const { segmentIndex, segmentPos } = segmentData[i];
                const nextSeg = Math.min(segmentIndex + 1, numSegments - 1);

                const offsetLow = segmentOffsets[segmentIndex] || 0;
                const offsetHigh = segmentOffsets[nextSeg] || 0;
                
                ripple = (1 - segmentPos) * offsetLow + segmentPos * offsetHigh;
                break;
        }
        
        // Apply ripple displacement on chosen axis
        positions[i * 3] = baseX;
        positions[i * 3 + 1] = baseY;
        positions[i * 3 + 2] = baseZ;
        positions[i * 3 + axisIndex] += ripple;
    }
}


function createCircleTexture() {
    // Use bigger canvas for smoother gradient in sprites
    const size = 128; 
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, size, size);

    // Create radial gradient with multiple stops for smooth falloff
    const gradient = ctx.createRadialGradient(
        size / 2, size / 2, size * 0.05,  // inner radius (bright core)
        size / 2, size / 2, size / 2      // outer radius (fade out)
    );

    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');      // bright center
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)');  // soft middle glow
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');      // transparent edge

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}


export function GlowSharkAnimated() {
    // Load & center points cloud
    const rawPoints = Object.values(SharkModelPoints3D);
    
    const xs = rawPoints.map(p => p.x);
    const ys = rawPoints.map(p => p.y);
    const zs = rawPoints.map(p => p.z);
    
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
    const centerZ = (Math.min(...zs) + Math.max(...zs)) / 2;
    
    const maxSpan = Math.max(
        Math.max(...xs) - Math.min(...xs),
        Math.max(...ys) - Math.min(...ys),
        Math.max(...zs) - Math.min(...zs)
    );
    const scaleFactor = 400 / maxSpan;
    
    const positions = new Float32Array(rawPoints.length * 3);
    const basePositions = new Float32Array(rawPoints.length * 3); // store original layout

    const colors = new Float32Array(rawPoints.length * 3);
    const color = new THREE.Color();

    rawPoints.forEach((p, i) => {
        const x = (p.x - centerX) * scaleFactor;
        const y = -(p.y - centerY) * scaleFactor;
        const z = (p.z - centerZ) * scaleFactor;
        
        // More verbose than 1 liner `positions.set([x, y, z], i * 3)`
        // BUT better performance for animation b/c avoids creatng temporary arrays
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        basePositions[i * 3] = x;
        basePositions[i * 3 + 1] = y;
        basePositions[i * 3 + 2] = z;
        
        // Start with cyan-ish glow, to animate later
        color.setHSL((i / rawPoints.length), 1.0, 0.6);
        colors.set([color.r, color.g, color.b], i * 3);
    });
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const sprite = createCircleTexture();
    const material = new THREE.PointsMaterial({
        size: 8.5, 
        map: sprite,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.NormalBlending,
        depthWrite: false,
        depthTest: false,
        sizeAttenuation: true,
    });
    
    const shark = new THREE.Points(geometry, material);
    // Shark facing front means nose to left side of user (sideways)
    shark.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    
    // Define control points for the path that go around the screen bounds
    const pathPoints = [
        new THREE.Vector3(600, 200, 0),
        new THREE.Vector3(-500, 100, -300),
        new THREE.Vector3(-400, -250, 400),
        new THREE.Vector3(400, -300, 300),
        new THREE.Vector3(600, 100, -200),
    ];
    
    // Create a smooth curve path (looped for continuous movement)
    const curve = new THREE.CatmullRomCurve3(pathPoints);
    curve.closed = true; 
    
    return {
        shark,
        geometry,
        basePositions,
        curve,
        update: (time) => {
            // Hue shift + pulse
            const colors = geometry.attributes.color.array;
            for (let i = 0; i < rawPoints.length; i++) {
                const hue = (time * 0.1 + i / rawPoints.length) % 1;
                const pulse = 0.5 + 0.5 * Math.sin(time + i * 0.01);
                color.setHSL(hue, 1.0, 0.5 + 0.2 * pulse);
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;
            }
            geometry.attributes.color.needsUpdate = true;
            
            // Introduce ripple effect to simulate swimming motion
            applyRipple({
                positions,
                basePositions,
                time,
                axis: "x",
                amplitude: 20,
                wavelength: 0.03,
                speed: 4,
                numSegments: 20,
                taperPower: 1.05,
                taperStart: 0.25,
                mode: "smooth", // "simple", "segmented", "smooth"
            });
            geometry.attributes.position.needsUpdate = true;
            
            // Move shark along curve (20 sec to complete 1 loop)
            const loopDuration = 20; 
            const t = (time % loopDuration) / loopDuration; // normalized time [0,1]
            const nextT = (t + 0.01) % 1; 
            const currentPos = curve.getPointAt(t);
            const nextPos = curve.getPointAt(nextT);
            
            shark.position.copy(currentPos);
            shark.up.set(0, 1, 0); // keep consistent up vector
            shark.lookAt(nextPos);
            
            // Ensure "front" of shark == nose facing "lookAt"
            shark.rotateX(-Math.PI / 2);
            shark.rotateZ(Math.PI);
        },
    };
}


