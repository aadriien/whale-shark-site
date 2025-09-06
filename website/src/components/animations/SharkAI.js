// // SharkAI.js
// import { useEffect, useRef } from 'react';
// import { Vehicle, WanderBehavior, EntityManager, Time } from 'yuka';
// import * as THREE from 'three';

// const SharkAI = ({ sharkRef, actions }) => {
//   const entityManager = useRef(new EntityManager());
//   const time = useRef(new Time());

//   useEffect(() => {
//     if (!sharkRef.current) return;

//     // Create Yuka vehicle
//     const vehicle = new Vehicle();
//     vehicle.maxSpeed = 1.5;

//     // Set initial position
//     vehicle.position.copy(sharkRef.current.position);

//     // Add wander behavior
//     vehicle.steering.add(new WanderBehavior());

//     // Link to render component
//     vehicle.setRenderComponent(sharkRef.current, (entity, renderComponent) => {
//       renderComponent.position.copy(entity.position);

//       const forward = entity.forward;
//       const targetQuat = new THREE.Quaternion().setFromUnitVectors(
//         new THREE.Vector3(0, 0, 1),
//         forward
//       );
//       renderComponent.quaternion.slerp(targetQuat, 0.1);
//     });

//     entityManager.current.add(vehicle);

//     // Start default animation
//     actions?.Swimming?.reset().play();

//     const animate = () => {
//       const delta = time.current.update().getDelta();
//       entityManager.current.update(delta);
//       requestAnimationFrame(animate);
//     };

//     animate();
//   }, [sharkRef, actions]);

//   return null;
// };

// export default SharkAI;






// import { useRef, useEffect } from 'react';
// import * as THREE from 'three';

// const SharkAI = ({ sharkRef, actions }) => {
//   const cameraRef = useRef(null); // The camera reference
//   const angleRef = useRef(0);     // Rotation angle for the camera
//   const radius = 10;              // Distance from the shark

//   useEffect(() => {
//     if (!sharkRef.current || !cameraRef.current) return;

//     // Start swimming animation
//     actions?.Swimming?.reset().play();

//     // Update camera position each frame to orbit the shark
//     const animateCamera = () => {
//       // Increment the angle for smooth orbiting around the shark
//       angleRef.current += 0.01; // Adjust this value for speed of rotation

//       // Calculate the camera's new position
//       const x = sharkRef.current.position.x + radius * Math.cos(angleRef.current);
//       const z = sharkRef.current.position.z + radius * Math.sin(angleRef.current);

//       // Update camera position
//       cameraRef.current.position.set(x, 5, z); // Keep the camera at a fixed height (e.g., y = 5)
      
//       // Make the camera look at the shark
//       cameraRef.current.lookAt(sharkRef.current.position);

//       requestAnimationFrame(animateCamera);
//     };

//     animateCamera(); // Start the camera animation loop

//   }, [sharkRef, actions]);

//   return <perspectiveCamera ref={cameraRef} />;
// };

// export default SharkAI;




// import { useEffect, useRef } from 'react';
// import { Vehicle, WanderBehavior, EntityManager, Time } from 'yuka';
// import * as THREE from 'three';

// const SharkAI = ({ sharkRef, actions }) => {
//   const entityManager = useRef(new EntityManager());
//   const time = useRef(new Time());

//   // Getting container bounds dynamically (relative to window size)
//   const bounds = {
//     x: [-window.innerWidth / 2, window.innerWidth / 2],
//     z: [-window.innerHeight / 2, window.innerHeight / 2]
//   };

//   useEffect(() => {
//     if (!sharkRef.current) return;

//     // Create Yuka vehicle
//     const vehicle = new Vehicle();
//     vehicle.maxSpeed = 1.5;

//     // Set initial position
//     vehicle.position.copy(sharkRef.current.position);

//     // Add wander behavior
//     const wander = new WanderBehavior();
//     vehicle.steering.add(wander);

//     // Link Yuka vehicle to shark model's 3D object
//     vehicle.setRenderComponent(sharkRef.current, (entity, renderComponent) => {
//       renderComponent.position.copy(entity.position);

//       // Smoothly rotate shark to face the direction it's moving
//       const forward = entity.forward;
//       const targetQuat = new THREE.Quaternion().setFromUnitVectors(
//         new THREE.Vector3(0, 0, 1),  // default forward direction
//         forward
//       );
//       renderComponent.quaternion.slerp(targetQuat, 0.1);  // smooth turning
//     });

//     entityManager.current.add(vehicle);

//     // Start default animation
//     actions?.Swimming?.reset().play();

//     const animate = () => {
//       const delta = time.current.update().getDelta();
//       entityManager.current.update(delta);
//       requestAnimationFrame(animate);
//     };

//     animate();

//     // Periodically check boundaries and turn the shark when near the edges
//     const checkBounds = () => {
//       const pos = vehicle.position;

//       const nearEdge =
//         pos.x < bounds.x[0] + 1 || pos.x > bounds.x[1] - 1 ||
//         pos.z < bounds.z[0] + 1 || pos.z > bounds.z[1] - 1;

//       if (nearEdge) {
//         // Reverse direction (turn around)
//         vehicle.forward.negate();
//       }

//       // Call again to keep checking the position
//       requestAnimationFrame(checkBounds);
//     };

//     checkBounds(); // Start the edge check loop

//   }, [sharkRef, actions, bounds]);

//   return null;
// };

// export default SharkAI;





// import { useEffect, useRef } from 'react';
// import { Vehicle, WanderBehavior, EntityManager, Time } from 'yuka';
// import * as THREE from 'three';

// // Helper function to rotate the shark smoothly
// function rotateShark(sharkRef, degree) {
//   if (!sharkRef.current) return;

//   // Convert degree to radians for Three.js
//   const targetRotation = THREE.MathUtils.degToRad(degree);

//   // Gradually rotate towards the target rotation
//   function rotateStep() {
//     const currentRotation = sharkRef.current.rotation.y;
//     const rotationDiff = targetRotation - currentRotation;

//     // If the difference is small enough, stop rotating
//     if (Math.abs(rotationDiff) < 0.01) {
//       sharkRef.current.rotation.y = targetRotation;
//       return;
//     }

//     // Otherwise, update the rotation gradually
//     const step = rotationDiff * 0.01; // Control speed with this factor
//     sharkRef.current.rotation.y += step;

//     // Call again for the next frame to continue smooth rotation
//     requestAnimationFrame(rotateStep);
//   }

//   // Start the rotation process
//   rotateStep();
// }

// const SharkAI = ({ sharkRef, actions }) => {
//   const entityManager = useRef(new EntityManager());
//   const time = useRef(new Time());

//   // Define visible screen bounds for the shark to stay inside
//   const bounds = {
//     x: [-15, 15],  // Adjust these values as per camera position/FOV
//     z: [-10, 10]
//   };

//   useEffect(() => {
//     if (!sharkRef.current) return;

//     // Create Yuka vehicle
//     const vehicle = new Vehicle();
//     vehicle.maxSpeed = 1.5;

//     // Set initial position
//     vehicle.position.copy(sharkRef.current.position);

//     // Add wander behavior
//     const wander = new WanderBehavior();
//     vehicle.steering.add(wander);

//     // Link Yuka vehicle to shark model's 3D object
//     vehicle.setRenderComponent(sharkRef.current, (entity, renderComponent) => {
//       renderComponent.position.copy(entity.position);

//       // Smoothly rotate shark to face the direction it's moving
//       const forward = entity.forward;
//       const targetQuat = new THREE.Quaternion().setFromUnitVectors(
//         new THREE.Vector3(0, 0, 1),
//         forward
//       );
//       renderComponent.quaternion.slerp(targetQuat, 0.1);  // smooth turning
//     });

//     entityManager.current.add(vehicle);

//     // Start default animation
//     actions?.Swimming?.reset().play();

//     const animate = () => {
//       const delta = time.current.update().getDelta();
//       entityManager.current.update(delta);
//       requestAnimationFrame(animate);
//     };

//     animate();

//     // Periodically check boundaries and turn the shark when near the edges
//     const checkBounds = () => {
//       const pos = vehicle.position;

//       const nearEdge =
//         pos.x < bounds.x[0] + 1 || pos.x > bounds.x[1] - 1 ||
//         pos.z < bounds.z[0] + 1 || pos.z > bounds.z[1] - 1;

//       if (nearEdge) {
//         // Reverse direction (turn around) and rotate the shark
//         vehicle.forward.negate();

//         // Call the rotateShark helper function to rotate the shark by 180 degrees smoothly
//         rotateShark(sharkRef, 180);  // Smooth rotation to turn the shark around
//       }

//       // Call again to keep checking the position
//       requestAnimationFrame(checkBounds);
//     };

//     checkBounds(); // Start the edge check loop

//   }, [sharkRef, actions, bounds]);

//   return null;
// };

// export default SharkAI;




// very close w this one!!!

// import { useEffect, useRef } from 'react';
// import { Vehicle, WanderBehavior, EntityManager, Time } from 'yuka';
// import * as THREE from 'three';

// const SharkAI = ({ sharkRef, actions }) => {
//   const entityManager = useRef(new EntityManager());
//   const time = useRef(new Time());

//   // Define visible screen bounds for the shark to stay inside
//   const bounds = {
//     x: [-15, 15],  // Adjust these values as per camera position/FOV
//     z: [-10, 10]
//   };

//   useEffect(() => {
//     if (!sharkRef.current) return;

//     // Create Yuka vehicle
//     const vehicle = new Vehicle();
//     vehicle.maxSpeed = 1.5;

//     // Set initial position
//     vehicle.position.copy(sharkRef.current.position);

//     // Add wander behavior
//     const wander = new WanderBehavior();
//     vehicle.steering.add(wander);

//     // Link Yuka vehicle to shark model's 3D object
//     vehicle.setRenderComponent(sharkRef.current, (entity, renderComponent) => {
//       renderComponent.position.copy(entity.position);

//       // Smoothly rotate shark to face the direction it's moving
//       const forward = entity.forward;
//       const targetQuat = new THREE.Quaternion().setFromUnitVectors(
//         new THREE.Vector3(0, 0, 1),
//         forward
//       );
//       renderComponent.quaternion.slerp(targetQuat, 0.1);  // smooth turning
//     });

//     entityManager.current.add(vehicle);

//     // Start default animation
//     actions?.Swimming?.reset().play();

//     const animate = () => {
//       const delta = time.current.update().getDelta();
//       entityManager.current.update(delta);
//       requestAnimationFrame(animate);
//     };

//     animate();

//     // Periodically check boundaries and turn the shark when near the edges
//     const checkBounds = () => {
//       const pos = vehicle.position;

//       const nearEdge =
//         pos.x < bounds.x[0] + 1 || pos.x > bounds.x[1] - 1 ||
//         pos.z < bounds.z[0] + 1 || pos.z > bounds.z[1] - 1;

//       if (nearEdge) {
//         // Reverse direction (turn around)
//         vehicle.forward.negate();
//       }

//       // Call again to keep checking the position
//       requestAnimationFrame(checkBounds);
//     };

//     checkBounds(); // Start the edge check loop

//   }, [sharkRef, actions, bounds]);

//   return null;
// };

// export default SharkAI;




// import { useEffect, useRef } from 'react';
// import { Vehicle, WanderBehavior, EntityManager, Time } from 'yuka';
// import * as THREE from 'three';

// const SharkAI = ({ sharkRef, actions }) => {
//   const entityManager = useRef(new EntityManager());
//   const time = useRef(new Time());

//   useEffect(() => {
//     if (!sharkRef.current) return;

//     const vehicle = new Vehicle();
//     vehicle.maxSpeed = 0.5;

//     // Start position
//     vehicle.position.set(-10, 0, -10);
//     vehicle.steering.add(new WanderBehavior());

//     vehicle.setRenderComponent(sharkRef.current, (entity, renderComponent) => {
//       // Clamp position so shark doesn't wander too far
//       entity.position.x = THREE.MathUtils.clamp(entity.position.x, -20, 20);
//       entity.position.y = THREE.MathUtils.clamp(entity.position.y, -5, 5);
//       entity.position.z = THREE.MathUtils.clamp(entity.position.z, -20, 20);

//       renderComponent.position.copy(entity.position);

//       const forward = entity.forward;
//       const targetQuat = new THREE.Quaternion().setFromUnitVectors(
//         new THREE.Vector3(0, 0, 1),
//         forward
//       );
//       renderComponent.quaternion.slerp(targetQuat, 0.05);
//     });

//     entityManager.current.add(vehicle);

//     // Start swimming animation
//     if (actions?.Swimming) {
//       actions.Swimming.reset().play();
//     }

//     const animate = () => {
//       const delta = time.current.update().getDelta();
//       entityManager.current.update(delta);
//       requestAnimationFrame(animate);
//     };

//     animate();
//   }, [sharkRef, actions]);

//   return null;
// };

// export default SharkAI;







// import { useEffect, useRef } from 'react';
// import { Vehicle, WanderBehavior, EntityManager, Time } from 'yuka';
// import * as THREE from 'three';

// const SharkAI = ({ sharkRef, actions }) => {
//   const entityManager = useRef(new EntityManager());
//   const time = useRef(new Time());

//   // Define the boundary limits where the shark can wander
//   const maxBounds = 5;  // Maximum distance the shark can move from the center

//   // Define vehicle and its movement behavior
//   const vehicle = useRef(new Vehicle());
//   const directionRef = useRef(1);  // Controls the direction of movement (+1 or -1)

//   useEffect(() => {
//     if (!sharkRef.current) return;

//     // Initialize vehicle
//     vehicle.current.maxSpeed = 1.5;
//     vehicle.current.position.copy(sharkRef.current.position);

//     // Add WanderBehavior to make the shark move randomly
//     vehicle.current.steering.add(new WanderBehavior());

//     // Sync the vehicle's position with the shark's 3D model
//     vehicle.current.setRenderComponent(sharkRef.current, (entity, renderComponent) => {
//       renderComponent.position.copy(entity.position);

//       // Make sure the shark faces the correct direction
//       const forward = entity.forward;
//       const targetQuat = new THREE.Quaternion().setFromUnitVectors(
//         new THREE.Vector3(0, 0, 1),
//         forward
//       );
//       renderComponent.quaternion.slerp(targetQuat, 0.1);
//     });

//     entityManager.current.add(vehicle.current);

//     // Start swimming animation
//     actions?.Swimming?.reset().play();

//     const animate = () => {
//       const delta = time.current.update().getDelta();
//       entityManager.current.update(delta);

//       // Check if the shark is within bounds on X and Z axis
//       const xPosition = vehicle.current.position.x;
//       const zPosition = vehicle.current.position.z;

//       // If the shark moves past the right boundary, reverse direction
//       if (xPosition > maxBounds || zPosition > maxBounds) {
//         directionRef.current = -1;
//       }

//       // If the shark moves past the left boundary, reverse direction
//       if (xPosition < -maxBounds || zPosition < -maxBounds) {
//         directionRef.current = 1;
//       }

//       // Apply the direction change to the shark's movement
//       vehicle.current.position.x += 0.03 * directionRef.current;
//       vehicle.current.position.z += 0.03 * directionRef.current;

//       requestAnimationFrame(animate);
//     };

//     animate();
//   }, [sharkRef, actions]);

//   return null;
// };

// export default SharkAI;




// import { useEffect, useRef } from 'react';
// import { Vehicle, WanderBehavior, EntityManager, Time } from 'yuka';
// import * as THREE from 'three';

// const SharkAI = ({ sharkRef, actions }) => {
//   const entityManager = useRef(new EntityManager());
//   const time = useRef(new Time());

//   // Boundary constraints (adjust these as needed)
//   const BOUNDARY = {
//     minX: -30,
//     maxX: 30,
//     minY: 0,
//     maxY: 10,
//     minZ: -5,
//     maxZ: 5
//   };

//   useEffect(() => {
//     if (!sharkRef.current) return;

//     // Create Yuka vehicle
//     const vehicle = new Vehicle();
//     vehicle.maxSpeed = 1.5;

//     // Set initial position
//     vehicle.position.copy(sharkRef.current.position);

//     // Add wander behavior (Yuka vehicle)
//     vehicle.steering.add(new WanderBehavior());

//     // Link the Yuka vehicle to the Three.js model
//     vehicle.setRenderComponent(sharkRef.current, (entity, renderComponent) => {
//       renderComponent.position.copy(entity.position);

//       // Ensure the shark is always facing the correct direction
//       const forward = entity.forward;
//       const targetQuat = new THREE.Quaternion().setFromUnitVectors(
//         new THREE.Vector3(0, 0, 1),
//         forward
//       );
//       renderComponent.quaternion.slerp(targetQuat, 0.1);
//     });

//     // Add vehicle to entity manager
//     entityManager.current.add(vehicle);

//     // Start the swimming animation
//     actions?.Swimming?.reset().play();

//     const animate = () => {
//       const delta = time.current.update().getDelta();
//       entityManager.current.update(delta);

//       // Constrain shark's position within boundaries
//       if (sharkRef.current.position.x > BOUNDARY.maxX) sharkRef.current.position.x = BOUNDARY.maxX;
//       if (sharkRef.current.position.x < BOUNDARY.minX) sharkRef.current.position.x = BOUNDARY.minX;
//       if (sharkRef.current.position.z > BOUNDARY.maxZ) sharkRef.current.position.z = BOUNDARY.maxZ;
//       if (sharkRef.current.position.z < BOUNDARY.minZ) sharkRef.current.position.z = BOUNDARY.minZ;

//       requestAnimationFrame(animate);
//     };

//     animate();
//   }, [sharkRef, actions]);

//   return null;
// };

// export default SharkAI;





// import { useEffect, useRef } from 'react';
// import { Vehicle, SeekBehavior, EntityManager, Time } from 'yuka';
// import * as THREE from 'three';

// const SharkAI = ({ sharkRef, actions }) => {
//   const entityManager = useRef(new EntityManager());
//   const time = useRef(new Time());
//   const sharkVehicle = useRef(null);
//   const target = useRef(null);

//   // Set up Yuka vehicle + behaviors on mount
//   useEffect(() => {
//     if (!sharkRef.current) return;

//     // 1. Shark as Yuka vehicle
//     const vehicle = new Vehicle();
//     vehicle.maxSpeed = 1.5;
//     vehicle.position.copy(sharkRef.current.position);
//     sharkVehicle.current = vehicle;

//     // 2. Define a simple target for the shark to follow (can be anything)
//     const targetVehicle = new Vehicle();
//     targetVehicle.position.set(0, 0, 0); // Set to an arbitrary position
//     target.current = targetVehicle;

//     // 3. Seek behavior toward target's position (for simple movement logic)
//     const seekBehavior = new SeekBehavior(targetVehicle.position);
//     vehicle.steering.add(seekBehavior);

//     // 4. Render link (sync Yuka vehicle to 3D model)
//     vehicle.setRenderComponent(sharkRef.current, (entity, renderComponent) => {
//       renderComponent.position.copy(entity.position);

//       const forward = entity.forward;
//       const targetQuat = new THREE.Quaternion().setFromUnitVectors(
//         new THREE.Vector3(0, 0, 1),
//         forward
//       );
//       renderComponent.quaternion.slerp(targetQuat, 0.1);
//     });

//     entityManager.current.add(vehicle);
//     entityManager.current.add(targetVehicle);

//     actions?.Swimming?.reset().play(); // Play swimming action if available
//   }, [sharkRef, actions]);

//   // Update Yuka simulation each frame
//   useFrame(() => {
//     if (!sharkVehicle.current) return;

//     // Update Yuka simulation
//     const delta = time.current.update().getDelta();
//     entityManager.current.update(delta);
//   });

//   return null;
// };

// export default SharkAI;





