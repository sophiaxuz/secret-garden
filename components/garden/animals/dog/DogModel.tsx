// RefObject describes the moving attachment points supplied by Dog.
import type { RefObject } from "react";
// Three supplies exact Group and Mesh types for the internal rig.
import type * as THREE from "three";

// The rig collects the dog's animated parts without exposing them to GardenAnimals.
export type DogRig = {
  head: RefObject<THREE.Group>;
  tail: RefObject<THREE.Group>;
  frontLeftLeg: RefObject<THREE.Mesh>;
  frontRightLeg: RefObject<THREE.Mesh>;
  backLeftLeg: RefObject<THREE.Mesh>;
  backRightLeg: RefObject<THREE.Mesh>;
};

// Render only the golden dog's visible geometry.
export function DogModel({
  rig,
  sleeping,
}: {
  // Rig exposes only the attachment points animated by Dog.
  rig: DogRig;
  // Sleeping compresses the existing eyes into closed eyelid shapes.
  sleeping: boolean;
}) {
  // A fragment lets Dog's root group position and scale this complete model.
  return (
    <>
      {/* A long oval forms the dog's torso. */}
      <mesh scale={[0.68, 0.56, 1.08]}>
        <sphereGeometry args={[0.72, 17, 11]} />
        <meshStandardMaterial color="#b77d43" roughness={1} />
      </mesh>
      {/* A cream chest patch softens the front of the body. */}
      <mesh position={[0, 0.02, 0.68]} scale={[0.46, 0.46, 0.22]}>
        <sphereGeometry args={[0.7, 13, 9]} />
        <meshStandardMaterial color="#e2c89d" roughness={1} />
      </mesh>
      {/* Group the head and face so they can sniff and look around together. */}
      <group ref={rig.head} position={[0, 0.34, 0.88]}>
        {/* A broad head creates a gentle, friendly expression. */}
        <mesh scale={[0.82, 0.76, 0.78]}>
          <sphereGeometry args={[0.55, 16, 11]} />
          <meshStandardMaterial color="#bd8248" roughness={1} />
        </mesh>
        {/* Two hanging ears frame the face. */}
        <mesh
          position={[-0.48, 0.04, -0.03]}
          rotation={[0.1, 0, 0.24]}
          scale={[0.28, 0.55, 0.2]}
        >
          <sphereGeometry args={[0.65, 12, 8]} />
          <meshStandardMaterial color="#895b35" roughness={1} />
        </mesh>
        <mesh
          position={[0.48, 0.04, -0.03]}
          rotation={[0.1, 0, -0.24]}
          scale={[0.28, 0.55, 0.2]}
        >
          <sphereGeometry args={[0.65, 12, 8]} />
          <meshStandardMaterial color="#895b35" roughness={1} />
        </mesh>
        {/* Dark eyes and tiny highlights make the dog attentive. */}
        <mesh position={[-0.23, 0.12, 0.4]} scale={[1, sleeping ? 0.12 : 1, 1]}>
          <sphereGeometry args={[0.075, 10, 7]} />
          <meshStandardMaterial color="#211b16" roughness={0.3} />
        </mesh>
        <mesh position={[0.23, 0.12, 0.4]} scale={[1, sleeping ? 0.12 : 1, 1]}>
          <sphereGeometry args={[0.075, 10, 7]} />
          <meshStandardMaterial color="#211b16" roughness={0.3} />
        </mesh>
        <mesh position={[-0.25, 0.145, 0.46]} visible={!sleeping}>
          <sphereGeometry args={[0.018, 7, 5]} />
          <meshBasicMaterial color="#fff8e9" />
        </mesh>
        <mesh position={[0.21, 0.145, 0.46]} visible={!sleeping}>
          <sphereGeometry args={[0.018, 7, 5]} />
          <meshBasicMaterial color="#fff8e9" />
        </mesh>
        {/* A cream muzzle projects beyond the head. */}
        <mesh position={[0, -0.09, 0.48]} scale={[0.55, 0.36, 0.34]}>
          <sphereGeometry args={[0.62, 13, 9]} />
          <meshStandardMaterial color="#e2c89d" roughness={1} />
        </mesh>
        {/* The black nose sits at the end of the muzzle. */}
        <mesh position={[0, -0.02, 0.69]} scale={[1.2, 0.82, 0.8]}>
          <sphereGeometry args={[0.105, 10, 7]} />
          <meshStandardMaterial color="#29231e" roughness={0.5} />
        </mesh>
        {/* A green collar connects the dog visually to the garden palette. */}
        <mesh position={[0, -0.37, -0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.36, 0.055, 8, 18]} />
          <meshStandardMaterial color="#56734b" roughness={0.85} />
        </mesh>
      </group>
      {/* Four narrow legs support and animate the dog's walking gait. */}
      <mesh ref={rig.frontLeftLeg} position={[-0.34, -0.48, 0.55]}>
        <cylinderGeometry args={[0.11, 0.13, 0.72, 8]} />
        <meshStandardMaterial color="#a96f3d" roughness={1} />
      </mesh>
      <mesh ref={rig.frontRightLeg} position={[0.34, -0.48, 0.55]}>
        <cylinderGeometry args={[0.11, 0.13, 0.72, 8]} />
        <meshStandardMaterial color="#a96f3d" roughness={1} />
      </mesh>
      <mesh ref={rig.backLeftLeg} position={[-0.34, -0.48, -0.55]}>
        <cylinderGeometry args={[0.12, 0.14, 0.72, 8]} />
        <meshStandardMaterial color="#a96f3d" roughness={1} />
      </mesh>
      <mesh ref={rig.backRightLeg} position={[0.34, -0.48, -0.55]}>
        <cylinderGeometry args={[0.12, 0.14, 0.72, 8]} />
        <meshStandardMaterial color="#a96f3d" roughness={1} />
      </mesh>
      {/* The raised tail pivots from the back of the body. */}
      <group
        ref={rig.tail}
        position={[0, 0.16, -0.9]}
        rotation={[-0.65, 0, 0.22]}
      >
        <mesh position={[0, 0.43, 0]}>
          <cylinderGeometry args={[0.1, 0.16, 0.86, 9]} />
          <meshStandardMaterial color="#a96f3d" roughness={1} />
        </mesh>
      </group>
    </>
  );
}
