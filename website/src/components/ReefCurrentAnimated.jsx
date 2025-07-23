import * as THREE from "three";


function createBlobParticles(baseColors, particleCount = 500, spaceScale = 2, pointSize = 12) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colorsArray = new Float32Array(particleCount * 3);
    
    // Increase placement range by spaceScale
    const rangeX = 120 * spaceScale;
    const rangeY = 40 * spaceScale;
    const rangeZ = 120 * spaceScale;
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = Math.random() * rangeX - rangeX / 2;
        positions[i * 3 + 1] = Math.random() * rangeY;
        positions[i * 3 + 2] = Math.random() * rangeZ - rangeZ / 2;
        
        const c = baseColors[Math.floor(Math.random() * baseColors.length)];
        colorsArray[i * 3] = c.r;
        colorsArray[i * 3 + 1] = c.g;
        colorsArray[i * 3 + 2] = c.b;
    }
    
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colorsArray, 3));
    
    // Create smooth radial gradient texture for points 
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    gradient.addColorStop(0.6, "rgba(255, 255, 255, 0.3)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    const texture = new THREE.CanvasTexture(canvas);
    
    const material = new THREE.PointsMaterial({
        vertexColors: true,
        map: texture,
        size: pointSize,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        alphaTest: 0.01,
    });
    
    const points = new THREE.Points(geometry, material);
    
    // Store data for animation
    points.userData = { positions, particleCount, geometry, spaceScale };
    return points;
}


function animateBlobParticles(blobGroup, options = {}) {
    const {
        moveVector = new THREE.Vector3(0.05, 0, 0), // base steady movement per frame
        oscillation = {
            axis1: 'z', amplitude1: 0.02, frequency1: 0.1,
            axis2: 'y', amplitude2: 0.005, frequency2: 0.05
        },
        bounds = { minX: -60, maxX: 60, minY: 0, maxY: 40, minZ: -60, maxZ: 60 },
    } = options;
    
    // Helper to get attribute index by axis letter
    const axisIndex = { x: 0, y: 1, z: 2 };
    
    blobGroup.traverse(child => {
        if (child.isPoints && child.userData.positions) {
            const { positions, particleCount, geometry } = child.userData;
            
            for (let i = 0; i < particleCount; i++) {
                // Steady movement
                positions[i * 3] += moveVector.x;
                positions[i * 3 + 1] += moveVector.y;
                positions[i * 3 + 2] += moveVector.z;
                
                // Oscillations
                if (oscillation.axis1) {
                    positions[i * 3 + axisIndex[oscillation.axis1]] +=
                    Math.sin(positions[i * 3] * oscillation.frequency1 + i) * oscillation.amplitude1;
                }
                if (oscillation.axis2) {
                    positions[i * 3 + axisIndex[oscillation.axis2]] +=
                    Math.sin(positions[i * 3] * oscillation.frequency2 + i) * oscillation.amplitude2;
                }
                
                // Looping on X axis (can be extended or customized)
                if (positions[i * 3] > bounds.maxX) {
                    positions[i * 3] = bounds.minX;
                    positions[i * 3 + 1] = Math.random() * (bounds.maxY - bounds.minY) + bounds.minY;
                    positions[i * 3 + 2] = Math.random() * (bounds.maxZ - bounds.minZ) + bounds.minZ;
                }
            }
            
            geometry.attributes.position.needsUpdate = true;
        }
    });
}


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


export function createIntricateReef() {
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
export function animateIntricateReef(reefGroup, elapsedTime) {
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


export function createReef() {
    const coralColors = [
        new THREE.Color("#ff775c"),  // vibrant coral
        new THREE.Color("#ff9f80"),  // warm peach
        new THREE.Color("#fcb1a0"),  // soft coral pink
        new THREE.Color("#ff6845"),  // deeper coral orange
    ];
    
    const blobReefGroup = createBlobParticles(coralColors, 300, 2, 13);

    // Add a clickable invisible mesh
    const clickable = new THREE.Mesh(
        new THREE.SphereGeometry(20, 16, 16), // size based on blob spread
        new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, opacity: 0.5, transparent: true })
    );
    clickable.name = "reef";

    // Store reference to clickable in userData for easy access when animating
    blobReefGroup.userData.clickable = clickable;
    blobReefGroup.add(clickable);

    return blobReefGroup;
}


// Helper which gets sent up to GalacticOcean parent for use in scene
export function animateReef(reefGroup) {
    animateBlobParticles(reefGroup, {
        moveVector: new THREE.Vector3(-0.015, 0, 0), 
        oscillation: {
            axis1: 'z', amplitude1: 0.025, frequency1: 0.12, 
            axis2: 'y', amplitude2: 0.006, frequency2: 0.06,
        },
        bounds: { minX: -30, maxX: 30, minY: 0, maxY: 50, minZ: -60, maxZ: 60 },
    });

    // Find points object inside reefGroup
    let points = null;
    reefGroup.traverse(child => {
        if (child.isPoints && child.userData.positions) {
            points = child;
        }
    });

    if (!points) return;

    // Calculate average center of particles
    const { positions, particleCount } = points.userData;
    let avgX = 0, avgY = 0, avgZ = 0;

    for (let i = 0; i < particleCount; i++) {
        avgX += positions[i * 3];
        avgY += positions[i * 3 + 1];
        avgZ += positions[i * 3 + 2];
    }
    avgX /= particleCount;
    avgY /= particleCount;
    avgZ /= particleCount;

    // Move clickable sphere mesh to average center (follow particle blob)
    const clickable = reefGroup.userData.clickable;
    if (clickable) {
        clickable.position.set(avgX, avgY, avgZ);
    }
}



// Ocean current with particle system that animates flow
export function createCurrent() {
    const currentColors = [
        new THREE.Color("#1e4023"),  // deep forest green
        new THREE.Color("#2e6b3b"),  // mossy earth green
        new THREE.Color("#4fa35d"),  // medium leafy green
        new THREE.Color("#90e17d"),  // fresh bright fern green (accent)
    ];
    
    const blobCurrentGroup = createBlobParticles(currentColors, 300, 2, 13);

    // Add a clickable invisible mesh
    const clickable = new THREE.Mesh(
        new THREE.SphereGeometry(20, 16, 16), // size based on blob spread
        new THREE.MeshBasicMaterial({ color: 0x4fa35d, wireframe: true, opacity: 0.5, transparent: true })
    );
    clickable.name = "current";

    // Store reference to clickable in userData for easy access when animating
    blobCurrentGroup.userData.clickable = clickable;
    blobCurrentGroup.add(clickable);
    
    return blobCurrentGroup;
}


// Helper which gets sent up to GalacticOcean parent for use in scene
export function animateCurrent(currentGroup) {
    animateBlobParticles(currentGroup, {
        moveVector: new THREE.Vector3(0.05, 0, 0), 
        oscillation: {
            axis1: 'z', amplitude1: 0.02, frequency1: 0.1,
            axis2: 'y', amplitude2: 0.005, frequency2: 0.05,
        },
        bounds: { minX: -30, maxX: 30, minY: 0, maxY: 50, minZ: -30, maxZ: 30 }
    });

    // Find points object inside reefGroup
    let points = null;
    currentGroup.traverse(child => {
        if (child.isPoints && child.userData.positions) {
            points = child;
        }
    });

    if (!points) return;

    // Calculate average center of particles
    const { positions, particleCount } = points.userData;
    let avgX = 0, avgY = 0, avgZ = 0;

    for (let i = 0; i < particleCount; i++) {
        avgX += positions[i * 3];
        avgY += positions[i * 3 + 1];
        avgZ += positions[i * 3 + 2];
    }
    avgX /= particleCount;
    avgY /= particleCount;
    avgZ /= particleCount;

    // Move clickable sphere mesh to average center (follow particle blob)
    const clickable = currentGroup.userData.clickable;
    if (clickable) {
        clickable.position.set(avgX, avgY, avgZ);
    }
}


