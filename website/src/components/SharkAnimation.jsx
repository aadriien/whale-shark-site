import React, { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

// import SharkAI from "./SharkAI.js";


// SHARK_MODEL_99a: 
// - has 1 children piece: 
//      - "GLTF_SceneRootNode"
// - has 1 animation:
//      - "Swim Cycle" (duration: 5.25 sec)
const SHARK_MODEL_99a = "/whale-shark-site/models/whale_shark_3D_model_99a.glb";

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
const SHARK_MODEL_fantasy = "/whale-shark-site/models/whale_shark_3D_model_fantasy.glb";


function SharkModel({ sharkRef, setActions }) {
    // Filepath "/models/{modelName}.glb" works since models in "public" (root) dir
    const { scene, animations } = useGLTF(SHARK_MODEL_fantasy); 
    const { actions: newActions } = useAnimations(animations, scene);
    
    // IF DESIRED: can remove other things - from root object (Sketchfab_model -> Root)
    const root = scene.children[0].children[0]; 
    
    // E.g. remove "ocean" (sand floor) from SHARK_MODEL_fantasy
    const ocean = root.children.find(child => child.name === "ocean");
    if (ocean) ocean.visible = false;
    
    
    // Set actions in parent component (SharkAnimation) to control animation externally
    useEffect(() => {
        setActions(newActions);
    }, [newActions, setActions]);
    
    // Begin with shark facing to the right (match x plane movement)
    useEffect(() => {
        if (sharkRef.current) {
            sharkRef.current.rotation.y = THREE.MathUtils.degToRad(90); 
        }
    }, [sharkRef]);
    
    return <primitive ref={sharkRef} object={scene} scale={0.5} />;
}


function rotateShark(sharkRef, targetRotation, setIsRotating) {
    if (!sharkRef.current) return;
    
    // Gradually rotate towards target rotation
    function rotateStep() {
        const currentRotation = sharkRef.current.rotation.y;
        const rotationDiff = targetRotation - currentRotation;
        
        // If difference small enough, stop rotating
        if (Math.abs(rotationDiff) < 0.01) {
            sharkRef.current.rotation.y = targetRotation;
            setIsRotating(false); 
            return;
        }
        
        // Update rotation gradually
        const step = rotationDiff * 0.02;
        sharkRef.current.rotation.y += step;
        
        // Call again for next frame to continue smooth rotation
        requestAnimationFrame(rotateStep);
    }
    rotateStep();
}



function SharkMovement({ sharkRef, actions }) {
    const directionRef = useRef(1);  
    const [isRotating, setIsRotating] = useState(false); 
    
    const [bounds] = useState({
        x: [-10, 10],
        z: [-10, 10],
    });
    
    // Apply continuous movement to shark with useFrame
    useFrame(() => {
        if (!sharkRef.current || !actions) return;
        
        // Only move if not currently rotating
        if (!isRotating) {
            sharkRef.current.position.x += 0.05 * directionRef.current;
            
            const pos = sharkRef.current.position;
            const nearEdge = pos.x < bounds.x[0] + 1 || pos.x > bounds.x[1] - 1;
            
            // Adjust direction (rotation) when turning away from edge
            if (nearEdge) {
                directionRef.current *= -1;
                const degree = directionRef.current * 90;
                
                setIsRotating(true); 
                rotateShark(sharkRef, THREE.MathUtils.degToRad(degree), setIsRotating);
            }
        }
    });
    
    useEffect(() => {
        if (actions && actions["Swimming"]) {
            actions["Swimming"].play();
        }
    }, [actions]);
}


export default function SharkAnimation() {
    // Use ref to track position on page (+ store actions for movement / animation)
    // Create in parent (SharkAnimation) so children (SharkModel, SharkMovement) can use
    const sharkRef = useRef();
    const [actions, setActions] = useState(null); 
    
    return (
        <Canvas 
            style={{ width: "100vw", height: "70vh", background: "#1a1a1a" }} 
            camera={{ position: [0, 5, 25], fov: 30 }}
        >
        <ambientLight />
        <directionalLight position={[2, 2, 5]} />
        
        {/* Suspense allows React to wait until 3D model loaded before render */}
        <Suspense fallback={null}>
            <SharkModel sharkRef={sharkRef} setActions={setActions} />
        </Suspense>
        
        {/* Handle movement */}
        <SharkMovement sharkRef={sharkRef} actions={actions} />
        
        {/* Shark AI for wandering movement */}
        {/* <SharkAI sharkRef={sharkRef} actions={actions} /> */}
        
        {/* OrbitControls so user can adjust camera, zoom, etc */}
        {/* <OrbitControls ref={cameraRef} /> */}
        
        </Canvas>
    );
}
    
    
    