import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

// Filepath '/models/{modelName}.glb' is fine since models in 'public' (root) dir
const SHARK_MODEL_99a = '/models/whale_shark_3D_model_99a.glb';
const SHARK_MODEL_fantasy = '/models/whale_shark_3D_model_fantasy.glb';

function SharkModel() {
  const { scene } = useGLTF(SHARK_MODEL_fantasy); 
  return <primitive object={scene} scale={0.5} />;
}

export default function SharkAnimation() {
  return (
    <Canvas style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      <ambientLight />
      <directionalLight position={[2, 2, 5]} />
      <Suspense fallback={null}>
        <SharkModel />
      </Suspense>
      <OrbitControls />
    </Canvas>
  );
}
