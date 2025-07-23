import * as THREE from "three";


// Add soft, curved noise for organic doily effect in coral reef
function applySmoothNoise(geometry, magnitude = 0.3) {
    const pos = geometry.attributes.position;

    for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const scale = (1 - Math.abs(y) / 30); // more influence near base
        const angle = y * 0.2 + i;
        const offset = Math.sin(angle) * magnitude * scale;
        
        pos.setX(i, pos.getX(i) + offset * 0.6);
        pos.setZ(i, pos.getZ(i) + offset);
        pos.setY(i, y + offset * 0.2);
    }
    pos.needsUpdate = true;
}


// Vertex color gradient for coral
function applyVertexColors(geometry, baseColor) {
    const colors = [];
    const pos = geometry.attributes.position;

    for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const shade = THREE.MathUtils.clamp(0.5 + (y / 25) * 0.4, 0, 1.2);
        const color = baseColor.clone().multiplyScalar(shade);
        colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
}


export function createReef() {
    const reefGroup = new THREE.Group();
    
    const coralBaseColors = [
        new THREE.Color(0xff7f50),
        new THREE.Color(0xff9f80),
        new THREE.Color(0xffb090),
        new THREE.Color(0xff6540),
    ];
    
    // Helper for fractal flower-style coral
    function createFractalCoral(depth, maxDepth, length, radiusTop, radiusBottom, baseColor) {
        if (depth > maxDepth) return null;
        
        const coralGeo = new THREE.CylinderGeometry(
            radiusTop,
            radiusBottom,
            length,
            16,
            3,
            true
        );
        applySmoothNoise(coralGeo, 0.4);
        applyVertexColors(coralGeo, baseColor);
        
        const coralMat = new THREE.MeshPhysicalMaterial({
            vertexColors: true,
            roughness: 0.6,
            metalness: 0.05,
            transmission: 0.4,
            thickness: 1.2,
            clearcoat: 0.2,
            clearcoatRoughness: 0.4,
            emissive: baseColor.clone().multiplyScalar(0.3),
            emissiveIntensity: 0.25,
            side: THREE.DoubleSide,
        });
        
        const coral = new THREE.Mesh(coralGeo, coralMat);
        coral.position.y = length / 2;
        
        const group = new THREE.Group();
        group.add(coral);
        
        if (depth < maxDepth) {
            const branches = 2 + Math.floor(Math.random() * 3);

            for (let i = 0; i < branches; i++) {
                const child = createFractalCoral(
                    depth + 1,
                    maxDepth,
                    length * 0.5, // shorter child branches
                    radiusTop * 0.6,
                    radiusBottom * 0.6,
                    baseColor
                );

                if (child) {
                    child.position.y = length;
                    child.rotation.z = (Math.random() - 0.5) * Math.PI * 0.5;
                    child.rotation.x = (Math.random() - 0.5) * Math.PI * 0.3;
                    group.add(child);
                }
            }
        }
        
        return group;
    }
    
    
    for (let i = 0; i < 10; i++) {
        const baseColor = coralBaseColors[i % coralBaseColors.length];
        const coralFractal = createFractalCoral(
            0,
            3,
            10 + Math.random() * 5,
            0.8 + Math.random(),
            1.5 + Math.random(),
            baseColor
        );
        
        coralFractal.position.set(Math.random() * 30 - 15, 0, Math.random() * 30 - 15);
        coralFractal.rotation.y = Math.random() * Math.PI * 2;
        coralFractal.scale.setScalar(0.8 + Math.random() * 0.7);
        reefGroup.add(coralFractal);
    }
    
    // Spherical coral balls
    const colors = [0xff6347, 0xff8c00, 0xf08080, 0xff4500];
    for (let i = 0; i < 20; i++) {
        const radius = 2 + Math.random() * 2;
        const geo = new THREE.SphereGeometry(radius, 14, 12);
        const baseColor = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
        
        const mat = new THREE.MeshStandardMaterial({
            color: baseColor,
            roughness: 0.6,
            metalness: 0.05,
            emissive: baseColor.clone().multiplyScalar(0.15),
            emissiveIntensity: 0.15,
        });
        
        const coralBall = new THREE.Mesh(geo, mat);
        coralBall.position.set(Math.random() * 40 - 20, Math.random() * 10, Math.random() * 40 - 20);
        coralBall.scale.multiplyScalar(0.8 + Math.random() * 0.5);
        reefGroup.add(coralBall);
    }
    
    return reefGroup;
}


// Helper which gets sent up to GalacticOcean parent for use in scene
export function animateReef(reefGroup, elapsedTime) {
    reefGroup.traverse((child) => {
        if (child.isMesh && child.geometry?.type === "CylinderGeometry") {
            child.rotation.z = 0.14 * Math.sin(elapsedTime * 0.8 + child.position.x);
            child.rotation.x = 0.12 * Math.cos(elapsedTime * 0.7 + child.position.z);
            
            if (child.material.emissive) {
                child.material.emissiveIntensity = 0.2 + 0.1 * Math.sin(elapsedTime * 2 + child.position.x);
            }
        }
    });
}



// Ocean current with particle system that animates flow
export function createCurrent() {
    const currentGroup = new THREE.Group();
    
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = Math.random() * 120 - 60;
        positions[i * 3 + 1] = Math.random() * 50;
        positions[i * 3 + 2] = Math.random() * 120 - 60;
    }
    
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    
    // Canvas texture with radial gradient alpha for smooth edges
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(175, 225, 200, 0.8)"); // sea foam greenish center
    gradient.addColorStop(0.6, "rgba(175, 225, 200, 0.3)");
    gradient.addColorStop(1, "rgba(175, 225, 200, 0)"); // fully transparent edges
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    const texture = new THREE.CanvasTexture(canvas);
    
    const material = new THREE.PointsMaterial({
        map: texture,
        size: 8,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        alphaTest: 0.01,
    });
    
    const points = new THREE.Points(geometry, material);
    currentGroup.add(points);
    
    currentGroup.userData = { positions, particleCount, geometry };
    
    return currentGroup;
}


// Helper which gets sent up to GalacticOcean parent for use in scene
export function animateCurrent(currentGroup) {
    const { positions, particleCount, geometry } = currentGroup.userData;
    
    for (let i = 0; i < particleCount; i++) {
        // Move particles steadily to right (+X)
        positions[i * 3] += 0.05;
        
        // Oscillate particles on Z axis with slow sine wave for flow
        positions[i * 3 + 2] += Math.sin(positions[i * 3] * 0.1 + i) * 0.02;
        
        // Slight vertical bobbing for subtle depth movement
        positions[i * 3 + 1] += Math.sin(positions[i * 3] * 0.05 + i) * 0.005;
        
        // Loop particles around when out of bounds
        if (positions[i * 3] > 60) {
            positions[i * 3] = -60;
            positions[i * 3 + 1] = Math.random() * 50;
            positions[i * 3 + 2] = Math.random() * 120 - 60;
        }
    }
    
    geometry.attributes.position.needsUpdate = true;
}


