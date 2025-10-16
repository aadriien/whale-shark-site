import { Suspense, useRef, useEffect, useState } from "react";
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


// Shark model with animation support
function SharkModel({ isAnimating, controlPoints, tetherPosition }) {
    const { scene, animations } = useGLTF(SHARK_MODEL_fantasy);
    const { actions } = useAnimations(animations, scene);
    const sharkRef = useRef();
    
    // IF DESIRED: can remove other things from root object (Sketchfab_model -> Root)
    const root = scene.children[0].children[0]; 
    
    // E.g. remove "ocean" (sand floor) from SHARK_MODEL_fantasy
    const ocean = root.children.find(child => child.name === "ocean");
    if (ocean) ocean.visible = false;
    
    // Set initial shark orientation to face right 
    useEffect(() => {
        if (sharkRef.current) {
            sharkRef.current.rotation.y = THREE.MathUtils.degToRad(90);
        }
    }, []);
    
    // Start swimming animation when animating
    useEffect(() => {
        if (isAnimating && actions?.Swimming) {
            actions.Swimming.play();
            actions.Swimming.setLoop(THREE.LoopRepeat);
        } 
        else if (actions?.Swimming) {
            actions.Swimming.stop();
        }
        
        return () => {
            if (actions?.Swimming) {
                actions.Swimming.stop();
            }
        };
    }, [isAnimating, actions]);
    
    // Position shark on curve 
    useFrame((state) => {
        if (!sharkRef.current || controlPoints.length < 3) return;
        
        const curve = new THREE.CatmullRomCurve3(controlPoints);
        curve.closed = true;
        
        let t, nextT;
        
        if (isAnimating) {
            // Animation mode: move along curve over time
            // Adaptive timing based on number of points 
            const baseTime = 5;
            const timePerPoint = 2;
            const loopDuration = Math.max(
                10, 
                Math.min(
                    30, 
                    baseTime + (controlPoints.length * timePerPoint)
                )
            );
            
            const time = state.clock.getElapsedTime();
            t = (time % loopDuration) / loopDuration;
            nextT = (t + 0.01) % 1;
        } 
        else {
            // Editing mode: stay at tether position
            t = tetherPosition;
            nextT = (tetherPosition + 0.01) % 1;
        }
        
        const currentPos = curve.getPointAt(t);
        const nextPos = curve.getPointAt(nextT);
        
        // Position & orient shark
        sharkRef.current.position.copy(currentPos);
        sharkRef.current.up.set(0, 1, 0);
        sharkRef.current.lookAt(nextPos);
    });
    
    return (
        <primitive 
            ref={sharkRef} 
            object={scene} 
            scale={0.6} 
        />
    );
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


// Tether point for shark to remain on curve while editing
function TetherPoint({ controlPoints, tetherPosition, curveClosed }) {
    const meshRef = useRef();
    
    useFrame(() => {
        if (!meshRef.current || controlPoints.length < 3) return;
        
        // Create curve & position tether point
        const curve = new THREE.CatmullRomCurve3(controlPoints);
        curve.closed = curveClosed;
        
        const position = curve.getPointAt(tetherPosition);
        meshRef.current.position.copy(position);
    });
    
    if (controlPoints.length < 3) return null;
    
    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial 
                color="#ffff00" 
                transparent
                opacity={0.9}
            />
        </mesh>
    );
}

// Curve visualization component
function CurveVisualization({ controlPoints, curveClosed }) {
    const lineRef = useRef();
    
    useEffect(() => {
        if (controlPoints.length < 3) return;
        
        // Always show as closed curve for visualization
        const curve = new THREE.CatmullRomCurve3(controlPoints);
        curve.closed = true; 
        
        // Generate points along curve for visualization
        const points = curve.getPoints(100);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        if (lineRef.current) {
            lineRef.current.geometry.dispose();
            lineRef.current.geometry = geometry;
        }
    }, [controlPoints, curveClosed]);
    
    if (controlPoints.length < 3) return null;
    
    return (
        <line ref={lineRef}>
            <bufferGeometry />
            <lineBasicMaterial 
                color={curveClosed ? "#ffffff" : "#888888"} 
                linewidth={2} 
                opacity={curveClosed ? 1.0 : 0.6}
                transparent
            />
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

    const [curveClosed, setCurveClosed] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [tetherPosition, setTetherPosition] = useState(0); 

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
            Math.random() * 25 - 5,
            Math.random() * 9 - 3,
            Math.random() * 15 - 5
        );
        setControlPoints(prev => [...prev, newPoint]);
    };
    
    // Remove selected control point
    const removeControlPoint = () => {
        if (selectedPointIndex !== null && controlPoints.length > 3) {
            setControlPoints(prev => prev.filter((_, i) => i !== selectedPointIndex));
            setSelectedPointIndex(null);
        }
    };
    
    const toggleAnimation = () => {
        if (isAnimating) {
            // Stop animation & return to editing mode
            setIsAnimating(false);
            setCurveClosed(false);
        } 
        else {
            // Start animation mode
            setIsAnimating(true);
            setCurveClosed(true);
            setSelectedPointIndex(null); 
        }
    };
    
    return (
        <div className="animation-controls">
            {/* UI Controls */}
            <div className="animation-points-container">
                <h3>{isAnimating ? "Shark Swimming Animation" : "Shark Path Editor"}</h3>
                
                {/* Show editing controls only when not animating */}
                {!isAnimating && (
                    <>
                        <button 
                            className="add-point-button"
                            onClick={addControlPoint}
                        >
                            Add Point
                        </button>
                        <button 
                            className="remove-point-button"
                            onClick={removeControlPoint}
                            disabled={selectedPointIndex === null || controlPoints.length <= 3}
                            style={{
                                background: selectedPointIndex !== null && controlPoints.length > 3 ? "#ff6b6b" : "#666",
                                cursor: selectedPointIndex !== null && controlPoints.length > 3 ? "pointer" : "not-allowed"
                            }}
                        >
                            Remove Point
                        </button>
                    </>
                )}
                
                {/* Main toggle button */}
                <button 
                    className="run-points-button"
                    onClick={toggleAnimation}
                    style={{
                        background: isAnimating ? "#ff6b6b" : "#4ecd83",
                        color: isAnimating ? "#300a0aff" : "#0a2609",
                    }}
                >
                    {isAnimating ? "Stop & Edit Loop" : "Finish & Run"}
                </button>
                
                {/* Instructions */}
                {isAnimating ? (
                    <p>Readjust path in editing mode.</p>
                ) : (
                    <p>Click spheres, drag to move. Run to see whale shark swim.</p>
                )}
            </div>
            
            <Canvas 
                style={{ width: "100%", height: "100%" }} 
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
                
                {/* Control points (only show while editing) */}
                {!isAnimating && controlPoints.map((point, index) => (
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
                <CurveVisualization controlPoints={controlPoints} curveClosed={curveClosed} />
                
                {/* Tether point */}
                {!isAnimating && (
                    <TetherPoint 
                        controlPoints={controlPoints} 
                        tetherPosition={tetherPosition}
                        curveClosed={true} 
                    />
                )}
                
                {/* Shark model */}
                <Suspense fallback={null}>
                    <SharkModel 
                        isAnimating={isAnimating}
                        controlPoints={controlPoints}
                        curveClosed={curveClosed}
                        tetherPosition={tetherPosition}
                    />
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
    
    
    