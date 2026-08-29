// RefObject describes the moving attachment points supplied by Rabbit.
import type { RefObject } from "react";
// Three supplies exact Group and Mesh types for the internal rig.
import type * as THREE from "three";

// The rig keeps the rabbit's three animated model parts together.
export type RabbitRig = {
  head: RefObject<THREE.Group>;
  leftEar: RefObject<THREE.Mesh>;
  rightEar: RefObject<THREE.Mesh>;
};

// Render only the rabbit's soft low-poly appearance.
export function RabbitModel({
  rig,
  sleeping,
}: {
  // Rig exposes the head and ears animated by Rabbit.
  rig: RabbitRig;
  // Sleeping flattens the existing dark eyes into closed eyelids.
  sleeping: boolean;
}) {
  // A fragment lets Rabbit's root group move the entire model as one animal.
  return (
    <>
      {/* A long rounded body creates the rabbit's crouched silhouette. */}
      <mesh scale={[0.66, 0.58, 0.95]}>
        <sphereGeometry args={[0.62, 16, 11]} />
        <meshStandardMaterial color="#a88f75" roughness={1} />
      </mesh>
      {/* Strong folded hind legs make the body read as a rabbit. */}
      <mesh position={[-0.42, -0.2, -0.22]} scale={[0.4, 0.34, 0.58]}>
        <sphereGeometry args={[0.62, 14, 9]} />
        <meshStandardMaterial color="#9c836b" roughness={1} />
      </mesh>
      <mesh position={[0.42, -0.2, -0.22]} scale={[0.4, 0.34, 0.58]}>
        <sphereGeometry args={[0.62, 14, 9]} />
        <meshStandardMaterial color="#9c836b" roughness={1} />
      </mesh>
      {/* A white puff at the back becomes the rabbit's cotton tail. */}
      <mesh position={[0, 0.04, -0.72]}>
        <sphereGeometry args={[0.24, 12, 8]} />
        <meshStandardMaterial color="#e8dfd1" roughness={1} />
      </mesh>
      {/* Group the face and ears so the whole head can dip to nibble. */}
      <group ref={rig.head} position={[0, 0.28, 0.58]} rotation={[0.12, 0, 0]}>
        {/* A small rounded head sits above the shoulders. */}
        <mesh scale={[0.82, 0.82, 0.92]}>
          <sphereGeometry args={[0.43, 16, 10]} />
          <meshStandardMaterial color="#ad947b" roughness={1} />
        </mesh>
        {/* Tall flattened ears rise from the top of the head. */}
        <mesh
          ref={rig.leftEar}
          position={[-0.18, 0.57, -0.02]}
          rotation={[0.08, 0, 0.08]}
          scale={[0.19, 0.62, 0.13]}
        >
          <sphereGeometry args={[0.7, 12, 8]} />
          <meshStandardMaterial color="#9d846e" roughness={1} />
        </mesh>
        <mesh
          ref={rig.rightEar}
          position={[0.18, 0.57, -0.02]}
          rotation={[-0.04, 0, -0.08]}
          scale={[0.19, 0.62, 0.13]}
        >
          <sphereGeometry args={[0.7, 12, 8]} />
          <meshStandardMaterial color="#9d846e" roughness={1} />
        </mesh>
        {/* Dark glossy eyes sit on the forward-facing side. */}
        <mesh
          position={[-0.22, 0.09, 0.36]}
          scale={[1, sleeping ? 0.12 : 1, 1]}
        >
          <sphereGeometry args={[0.065, 10, 7]} />
          <meshStandardMaterial color="#171614" roughness={0.25} />
        </mesh>
        <mesh position={[0.22, 0.09, 0.36]} scale={[1, sleeping ? 0.12 : 1, 1]}>
          <sphereGeometry args={[0.065, 10, 7]} />
          <meshStandardMaterial color="#171614" roughness={0.25} />
        </mesh>
        {/* A pale muzzle and pink nose complete the rabbit's face. */}
        <mesh position={[0, -0.08, 0.41]} scale={[0.38, 0.23, 0.18]}>
          <sphereGeometry args={[0.7, 12, 8]} />
          <meshStandardMaterial color="#d3c1ae" roughness={1} />
        </mesh>
        <mesh position={[0, -0.02, 0.55]} scale={[1.1, 0.8, 0.75]}>
          <sphereGeometry args={[0.07, 10, 7]} />
          <meshStandardMaterial color="#9c6867" roughness={0.7} />
        </mesh>
      </group>
      {/* Two narrow forepaws touch the grass beneath the chest. */}
      <mesh position={[-0.2, -0.37, 0.35]} scale={[0.16, 0.16, 0.42]}>
        <sphereGeometry args={[0.65, 10, 7]} />
        <meshStandardMaterial color="#9c836b" roughness={1} />
      </mesh>
      <mesh position={[0.2, -0.37, 0.35]} scale={[0.16, 0.16, 0.42]}>
        <sphereGeometry args={[0.65, 10, 7]} />
        <meshStandardMaterial color="#9c836b" roughness={1} />
      </mesh>
    </>
  );
}
