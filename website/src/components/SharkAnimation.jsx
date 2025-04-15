import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';


// SHARK_MODEL_99a: 
// - has 1 children piece: 
//      - "GLTF_SceneRootNode"
// - has 1 animation:
//      - "Swim Cycle" (duration: 5.25 sec)
const SHARK_MODEL_99a = '/models/whale_shark_3D_model_99a.glb';

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
const SHARK_MODEL_fantasy = '/models/whale_shark_3D_model_fantasy.glb';


function SharkModel({ setActions }) {
  // Filepath '/models/{modelName}.glb' works since models in 'public' (root) dir
  const { scene, animations } = useGLTF(SHARK_MODEL_fantasy); 
  const { actions: newActions } = useAnimations(animations, scene);
  
  // IF DESIRED: can remove other things - from root object (Sketchfab_model → Root)
  const root = scene.children[0].children[0]; 

  // E.g. remove "ocean" (sand floor) from SHARK_MODEL_fantasy
  const ocean = root.children.find(child => child.name === 'ocean');
  if (ocean) ocean.visible = false;


  // Set actions in parent component (SharkAnimation) to control animation externally
  useEffect(() => {
    setActions(newActions);
  }, [newActions, setActions]);

  return <primitive object={scene} scale={0.5} />;
}


function SharkMovement({ sharkRef, actions }) {
    // Play "Swimming" animation
    useEffect(() => {
        if (actions && actions['Swimming']) {
        actions['Swimming'].play();
        }
    }, [actions]);

    // Apply continuous movement to shark with useFrame
    useFrame(() => {
      if (sharkRef.current) {
        // Move shark along x-axis over time (speed = 0.01, reset loop via -10)
        sharkRef.current.position.x += 0.01; 
        if (sharkRef.current.position.x > 10) {
          sharkRef.current.position.x = -10;
        }
      }
    });
  
    return null;
  }


export default function SharkAnimation() {
  // Use ref to track position on page (+ store actions for movement / animation)
  const sharkRef = useRef();
  const [actions, setActions] = useState(null); 
  
  return (
    <Canvas style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      <ambientLight />
      <directionalLight position={[2, 2, 5]} />

      {/* Suspense allows React to wait until 3D model loaded before render */}
      <Suspense fallback={null}>
        <SharkModel setActions={setActions} />
      </Suspense>

      {/* Handle movement */}
      <SharkMovement sharkRef={sharkRef} actions={actions} />

      {/* OrbitControls so user can adjust camera, zoom, etc */}
      <OrbitControls />

    </Canvas>
  );
}

