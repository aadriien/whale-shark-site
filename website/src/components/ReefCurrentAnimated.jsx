import * as THREE from "three";


function createBlobParticles(baseColors, particleCount = 500, spaceScale = 2, pointSize = 12) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colorsArray = new Float32Array(particleCount * 3);

    // Define ellipsoid radii for distribution (scaled), should match x/y/z bounds
    const radiusX = 60 * spaceScale;
    const radiusY = 35 * spaceScale;
    const radiusZ = 60 * spaceScale;

    // Helper function to add smooth noise offset based on index & coords
    function noiseOffset(x, y, z, i) {
        return (
            // Higher values == more spiky / misshapen / blobby shape
            Math.sin(x * 7 + i) * 3.2 + 
            Math.cos(y * 9 + i * 1.5) * 2.7 +
            Math.sin(z * 8 + i * 0.7) * 3.2
        );
    }

    for (let i = 0; i < particleCount; i++) {
        let x, y, z;
        do {
            x = (Math.random() * 2 - 1) * radiusX;
            y = (Math.random() * 2 - 1) * radiusY;
            z = (Math.random() * 2 - 1) * radiusZ;
        } while ((x * x) / (radiusX * radiusX) + (y * y) / (radiusY * radiusY) + (z * z) / (radiusZ * radiusZ) > 1);

        // Apply noise offset on each axis separately to get irregular shape
        x += noiseOffset(x, y, z, i) * 0.5; 
        y += noiseOffset(y, z, x, i + 1000) * 0.4; 
        z += noiseOffset(z, x, y, i + 2000) * 0.5;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y + radiusY * 0.4; // slight upward shift bias
        positions[i * 3 + 2] = z;

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
    // Base steady movements per frame
    const {
        moveVector = new THREE.Vector3(0.05, 0, 0),
        oscillation = {
            axis1: 'z', amplitude1: 0.02, frequency1: 0.1,
            axis2: 'y', amplitude2: 0.005, frequency2: 0.05
        },
        bounds = { minX: -60, maxX: 60, minY: 0, maxY: 40, minZ: -60, maxZ: 60 },
    } = options;

    const axisIndex = { x: 0, y: 1, z: 2 };
    const rangeX = bounds.maxX - bounds.minX;

    blobGroup.traverse(child => {
        if (child.isPoints && child.userData.positions) {
            const { positions, particleCount, geometry } = child.userData;

            // Initialize velocity array if not present
            if (!child.userData.velocities) {
                const velocities = new Float32Array(particleCount * 3);
                for (let i = 0; i < particleCount; i++) {
                    velocities[i * 3] = moveVector.x * (0.8 + 0.4 * Math.random());
                    velocities[i * 3 + 1] = moveVector.y;
                    velocities[i * 3 + 2] = moveVector.z;
                }
                child.userData.velocities = velocities;
            }

            const velocities = child.userData.velocities;

            for (let i = 0; i < particleCount; i++) {
                // Smoothly adjust velocities toward target moveVector
                velocities[i * 3] = THREE.MathUtils.lerp(velocities[i * 3], moveVector.x, 0.05);
                velocities[i * 3 + 1] = THREE.MathUtils.lerp(velocities[i * 3 + 1], moveVector.y, 0.05);
                velocities[i * 3 + 2] = THREE.MathUtils.lerp(velocities[i * 3 + 2], moveVector.z, 0.05);

                // Apply velocity to position
                positions[i * 3] += velocities[i * 3];
                positions[i * 3 + 1] += velocities[i * 3 + 1];
                positions[i * 3 + 2] += velocities[i * 3 + 2];

                // Apply oscillations
                if (oscillation.axis1) {
                    positions[i * 3 + axisIndex[oscillation.axis1]] +=
                        Math.sin(positions[i * 3] * oscillation.frequency1 + i) * oscillation.amplitude1;
                }
                if (oscillation.axis2) {
                    positions[i * 3 + axisIndex[oscillation.axis2]] +=
                        Math.sin(positions[i * 3] * oscillation.frequency2 + i) * oscillation.amplitude2;
                }

                // Smooth modular wrap on X axis
                positions[i * 3] = ((positions[i * 3] - bounds.minX) % rangeX + rangeX) % rangeX + bounds.minX;

                // Softly jitter Y & Z toward bounds on wrap (not strictly needed here anymore)
                positions[i * 3 + 1] = THREE.MathUtils.clamp(positions[i * 3 + 1], bounds.minY, bounds.maxY);
                positions[i * 3 + 2] = THREE.MathUtils.clamp(positions[i * 3 + 2], bounds.minZ, bounds.maxZ);
            }

            geometry.attributes.position.needsUpdate = true;
        }
    });
}


function createBlobGroup({
    baseColors,
    particleCount = 250,
    spaceScale = 2.6,
    pointSize = 13,
    clickableRadius = 50,
    name = "blob"
} = {}) {
    const blobGroup = createBlobParticles(baseColors, particleCount, spaceScale, pointSize);

    // Add a clickable invisible mesh
    const clickable = new THREE.Mesh(
        new THREE.SphereGeometry(clickableRadius, 16, 16), // size based on blob spread
        new THREE.MeshBasicMaterial({ visible: false })
        // new THREE.MeshBasicMaterial({ color: baseColors[0].getHex(), wireframe: true, opacity: 0.5, transparent: true })
    );
    clickable.name = name;

    // Store reference to clickable in userData for easy access when animating
    blobGroup.userData.clickable = clickable;
    blobGroup.add(clickable);

    return blobGroup;
}


function animateBlobGroup(blobGroup, {
    moveVector = new THREE.Vector3(0, 0, 0),
    oscillation = {
        axis1: 'z', amplitude1: 0.025, frequency1: 0.12,
        axis2: 'y', amplitude2: 0.006, frequency2: 0.06,
    },
    bounds = { minX: -60, maxX: 60, minY: 0, maxY: 70, minZ: -60, maxZ: 60 }
} = {}) {
    animateBlobParticles(blobGroup, { moveVector, oscillation, bounds });

    // Find points object inside blobGroup
    let points = null;
    blobGroup.traverse(child => {
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
    const clickable = blobGroup.userData.clickable;
    if (clickable) {
        clickable.position.set(avgX, avgY, avgZ);
    }
}


export function createReef() {
    const coralColors = [
        new THREE.Color("#ff775c"),  // vibrant coral
        new THREE.Color("#ff9f80"),  // warm peach
        new THREE.Color("#fcb1a0"),  // soft coral pink
        new THREE.Color("#ff6845"),  // deeper coral orange
    ];
    return createBlobGroup({
        baseColors: coralColors,
        particleCount: 250,
        spaceScale: 2.6,
        pointSize: 13,
        clickableRadius: 50,
        name: "reef"
    });
}


export function animateReef(reefGroup) {
    animateBlobGroup(reefGroup, {
        moveVector: new THREE.Vector3(-0.015, 0, 0),
        oscillation: {
            axis1: 'z', amplitude1: 0.025, frequency1: 0.12,
            axis2: 'y', amplitude2: 0.006, frequency2: 0.06,
        },
        bounds: { minX: -60, maxX: 60, minY: 0, maxY: 70, minZ: -60, maxZ: 60 },
    });
}


export function createCurrent() {
    const currentColors = [
        new THREE.Color("#1e4023"),  // deep forest green
        new THREE.Color("#2e6b3b"),  // mossy earth green
        new THREE.Color("#4fa35d"),  // medium leafy green
        new THREE.Color("#90e17d"),  // bright fern green 
    ];
    return createBlobGroup({
        baseColors: currentColors,
        particleCount: 250,
        spaceScale: 2.6,
        pointSize: 13,
        clickableRadius: 50,
        name: "current"
    });
}


export function animateCurrent(currentGroup) {
    animateBlobGroup(currentGroup, {
        moveVector: new THREE.Vector3(0.015, 0, 0),
        oscillation: {
            axis1: 'z', amplitude1: 0.025, frequency1: 0.12,
            axis2: 'y', amplitude2: 0.006, frequency2: 0.06,
        },
        bounds: { minX: -60, maxX: 60, minY: 0, maxY: 70, minZ: -60, maxZ: 60 },
    });
}



