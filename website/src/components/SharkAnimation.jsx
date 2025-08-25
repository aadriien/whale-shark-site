import React, { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations, TransformControls } from "@react-three/drei";
import * as THREE from "three";


// SHARK_MODEL_fantasy: 
// - has 3 children pieces: 
//      - "particles", "ocean", "WhaleSharkRig"
// - has 6 animations: 
//      - "Swimming" (duration: 1.208 sec),
//      - "Swimming_L" (duration: 1.208 sec), 
//      - "Swimming_R" (duration: 1.208 sec), 
//      - "Swimming_U" (duration: 1.208 sec), 
//      - "Swimming_D" (duration: 1.208 sec), 
//      - "Idle" (duration: 2.375 sec)
const SHARK_MODEL_fantasy = "./models/whale_shark_3D_model_fantasy.glb";


// Shark model (simplified for curve editor)
function SharkModel() {
    const { scene } = useGLTF(SHARK_MODEL_fantasy);
    
    // IF DESIRED: can remove other things from root object (Sketchfab_model -> Root)
    const root = scene.children[0].children[0]; 
    
    // E.g. remove "ocean" (sand floor) from SHARK_MODEL_fantasy
    const ocean = root.children.find(child => child.name === "ocean");
    if (ocean) ocean.visible = false;
    
    return <primitive object={scene} scale={1.0} position={[0, -2, 0]} />;
}


// Control point component with draggable sphere
function ControlPoint({ position, onDrag, isSelected, onSelect, index }) {
    const meshRef = useRef();
    
    return (
        <group>
            {/* Visible sphere for control point */}
            <mesh
                ref={meshRef}
                position={position}
                onClick={onSelect}
            >
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshBasicMaterial 
                    color={isSelected ? '#ff6b6b' : '#4ecdc4'} 
                    transparent
                    opacity={0.8}
                />
            </mesh>
            
            {/* Transform controls for dragging when selected */}
            {isSelected && (
                <TransformControls
                    object={meshRef}
                    mode="translate"
                    onObjectChange={(e) => {
                        if (meshRef.current) {
                            onDrag(index, meshRef.current.position.clone());
                        }
                    }}
                />
            )}
        </group>
    );
}


// Curve visualization component
function CurveVisualization({ controlPoints }) {
    const lineRef = useRef();
    
    useEffect(() => {
        if (controlPoints.length < 2) return;
        
        // Create Catmull-Rom curve from control points
        const curve = new THREE.CatmullRomCurve3(controlPoints);
        curve.closed = false; // REVISIT: Can be toggled later
        
        // Generate points along curve for visualization
        const points = curve.getPoints(100);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        if (lineRef.current) {
            lineRef.current.geometry.dispose();
            lineRef.current.geometry = geometry;
        }
    }, [controlPoints]);
    
    if (controlPoints.length < 2) return null;
    
    return (
        <line ref={lineRef}>
            <bufferGeometry />
            <lineBasicMaterial color="#ffffff" linewidth={2} />
        </line>
    );
}


export default function SharkAnimation() {
    // State for managing control points & selection
    const [controlPoints, setControlPoints] = useState([
        new THREE.Vector3(-10, 0, -5),
        new THREE.Vector3(-5, 3, 0),
        new THREE.Vector3(0, -2, 5),
        new THREE.Vector3(5, 1, 0),
        new THREE.Vector3(10, 0, -3)
    ]);
    const [selectedPointIndex, setSelectedPointIndex] = useState(null);
    const orbitControlsRef = useRef();
    
    // Handle control point dragging
    const handlePointDrag = (index, newPosition) => {
        setControlPoints(prev => {
            const updated = [...prev];
            updated[index] = newPosition;
            return updated;
        });
    };
    
    // Handle control point selection
    const handlePointSelect = (index) => {
        setSelectedPointIndex(index);
    };
    
    // Add new control point
    const addControlPoint = () => {
        const newPoint = new THREE.Vector3(
            Math.random() * 10 - 5,
            Math.random() * 6 - 3,
            Math.random() * 10 - 5
        );
        setControlPoints(prev => [...prev, newPoint]);
    };
    
    // Remove selected control point
    const removeControlPoint = () => {
        if (selectedPointIndex !== null && controlPoints.length > 2) {
            setControlPoints(prev => prev.filter((_, i) => i !== selectedPointIndex));
            setSelectedPointIndex(null);
        }
    };
    
    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
            {/* UI Controls */}
            <div style={{
                position: "absolute",
                top: "85px",
                left: "15px",
                zIndex: 100,
                background: "rgba(0,0,0,0.7)",
                padding: "15px",
                borderRadius: "8px",
                color: "white",
                fontFamily: "Arial, sans-serif"
            }}>
                <h3 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>Shark Path Editor</h3>
                <button 
                    onClick={addControlPoint}
                    style={{
                        marginRight: "10px",
                        padding: "8px 12px",
                        background: "#4ecdc4",
                        border: "none",
                        borderRadius: "4px",
                        color: "white",
                        cursor: "pointer"
                    }}
                >
                    Add Point
                </button>
                <button 
                    onClick={removeControlPoint}
                    disabled={selectedPointIndex === null || controlPoints.length <= 2}
                    style={{
                        padding: "8px 12px",
                        background: selectedPointIndex !== null ? "#ff6b6b" : "#666",
                        border: "none",
                        borderRadius: "4px",
                        color: "white",
                        cursor: selectedPointIndex !== null ? "pointer" : "not-allowed"
                    }}
                >
                    Remove Point
                </button>
                <p style={{ margin: "10px 0 0 0", fontSize: "12px", opacity: 0.8 }}>
                    Click spheres to select, drag to move
                </p>
            </div>
            
            <Canvas 
                style={{ 
                    width: "100%", 
                    height: "100%" 
                }} 
                onPointerMissed={(event) => {
                    // Fires when user clicked but no object hit (done editing point)
                    setSelectedPointIndex(null);
                }}
                camera={{ position: [15, 10, 15], fov: 50 }}
            >
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 5]} intensity={0.8} />
                
                {/* Grid helper for reference */}
                <gridHelper args={[30, 30]} position={[0, -5, 0]} />
                
                {/* Control points */}
                {controlPoints.map((point, index) => (
                    <ControlPoint
                        key={index}
                        index={index}
                        position={point}
                        isSelected={selectedPointIndex === index}
                        onSelect={() => handlePointSelect(index)}
                        onDrag={handlePointDrag}
                    />
                ))}
                
                {/* Curve visualization */}
                <CurveVisualization controlPoints={controlPoints} />
                
                {/* Shark model for reference */}
                <Suspense fallback={null}>
                    <SharkModel />
                </Suspense>
                
                {/* Orbit controls for camera (disabled when dragging points) */}
                <OrbitControls 
                    ref={orbitControlsRef}
                    enableDamping
                    dampingFactor={0.05}
                    enabled={selectedPointIndex === null} 
                />
            </Canvas>
        </div>
    );
}
    
    
    