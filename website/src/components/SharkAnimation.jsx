import React, { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
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


function SharkModel({ sharkRef, setActions }) {
    // Filepath "./models/{modelName}.glb" works since models in "public" (root) dir
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
    
    return <primitive ref={sharkRef} object={scene} scale={2.0} />;
}


function moveSharkTo(sharkRef, currentPos, nextPos) {
    if (!sharkRef.current) return;
    
    sharkRef.current.position.copy(currentPos);
    
    // Set up vector & look at next position 
    sharkRef.current.up.set(0, 1, 0);
    sharkRef.current.lookAt(nextPos);
}


function SharkMovement({ sharkRef, actions }) {
    const directionRef = useRef(1);
    const speedRef = useRef(0.05);
    
    const bounds = {
        x: [-10, 10],
        y: [0, 0],  // keep y constant for simple horizontal movement
        z: [0, 0]   // keep z constant for simple horizontal movement
    };
    
    useFrame(() => {
        if (!sharkRef.current || !actions) return;
        
        const currentPos = sharkRef.current.position.clone();
        
        // Calculate next position
        const nextX = currentPos.x + (speedRef.current * directionRef.current);
        const nextPos = new THREE.Vector3(
            nextX,
            currentPos.y, 
            currentPos.z 
        );
        
        // Check bounds & reverse direction
        if (nextX >= bounds.x[1] || nextX <= bounds.x[0]) {
            directionRef.current *= -1;
            nextPos.x = currentPos.x + (speedRef.current * directionRef.current);
        }
        
        // Calculate look-ahead position to face correct direction
        const lookAheadPos = new THREE.Vector3(
            nextPos.x + (directionRef.current * 2), 
            nextPos.y,
            nextPos.z
        );
        
        moveSharkTo(sharkRef, nextPos, lookAheadPos);
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
            style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "cover", 
                position: "relative" 
            }} 
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
        
        </Canvas>
    );
}
    
    
    