// Layout effects populate GPU instance transforms after the petal mesh mounts.
import { useLayoutEffect, useRef } from "react";
// Three supplies constants that are not exposed as JSX components.
import * as THREE from "three";
// The shared target hides flower registration, metadata, and cleanup.
import { GardenInteractionTarget } from "../interaction/GardenInteractionTarget";
// The memory object gives this visual flower an identity and inspectable content.
import type { FlowerMemory } from "./flower-memory";
// A dedicated component gives each leaf a pointed silhouette and visible vein.
import { FlowerLeaf } from "./FlowerLeaf";

// These values describe one procedural flower instance.
type FlowerProps = {
  // A tuple stores the flower's x, y, and z coordinates.
  position: [number, number, number];
  // This color is applied to every petal.
  color: string;
  // This data is exposed to the raycasting interaction module.
  memory: FlowerMemory;
  // The targeted flower receives a subtle glow.
  highlighted?: boolean;
  // Scale changes the size of the whole flower group.
  scale?: number;
  // Petal count creates visual variation between flowers.
  petals?: number;
  // Bell flowers use cones and point downward.
  bell?: boolean;
};

// Build a complete flower from simple Three.js primitives.
export function Flower({
  position,
  color,
  memory,
  highlighted = false,
  scale = 1,
  petals = 8,
  bell = false,
}: FlowerProps) {
  // This ref exposes the one instanced mesh shared by every petal on this flower.
  const petalMesh = useRef<THREE.InstancedMesh>(null);

  // Fill the shared petal mesh whenever this flower's petal count changes.
  useLayoutEffect(() => {
    // Stop until React has attached the instanced mesh to the ref.
    if (!petalMesh.current) return;
    // Reuse one temporary object to compose every petal transform.
    const transform = new THREE.Object3D();
    // Give each petal its own position and rotation around the flower center.
    for (let index = 0; index < petals; index += 1) {
      // Calculate this petal's evenly spaced angle around the complete circle.
      const angle = (index * Math.PI * 2) / petals;
      // Sine and cosine place the petal around the flower's center.
      transform.position.set(Math.cos(angle) * 0.19, Math.sin(angle) * 0.19, 0);
      // Rotate the petal so its long side points away from the center.
      transform.rotation.set(0, 0, angle - Math.PI / 2);
      // Keep every petal at the geometry's original scale.
      transform.scale.set(1, 1, 1);
      // Convert this position, rotation, and scale into one instance matrix.
      transform.updateMatrix();
      // Store the completed matrix in the matching GPU instance slot.
      petalMesh.current.setMatrixAt(index, transform.matrix);
    }
    // Tell Three.js to upload the new instance matrices to the GPU.
    petalMesh.current.instanceMatrix.needsUpdate = true;
    // Recalculate the flower head's bounds for correct view-frustum culling.
    petalMesh.current.computeBoundingSphere();
  }, [petals]);

  // Grouping the pieces lets position and scale affect the entire flower.
  return (
    <group position={position} scale={scale}>
      {/* One target surrounds the stem, leaves, and complete flower head. */}
      <GardenInteractionTarget
        item={{ ...memory, kind: "flower" }}
        position={[0, 0.9, 0]}
        size={[0.9, 1.8, 0.9]}
      />
      {/* A narrow cylinder forms the stem. */}
      <mesh position={[0, 0.7, 0]}>
        {/* The top and bottom radii differ slightly for an organic taper. */}
        <cylinderGeometry args={[0.025, 0.045, 1.4, 8]} />
        {/* A rough green material keeps the stem from looking plastic. */}
        <meshStandardMaterial color="#34543a" roughness={0.9} />
      </mesh>
      {/* The lower leaf grows outward from the left side of the stem. */}
      <FlowerLeaf
        position={[-0.18, 0.67, 0]}
        rotation={[0.12, -0.28, 0.85]}
        scale={0.9}
      />
      {/* A smaller opposite leaf breaks symmetry and fills the upper stem. */}
      <FlowerLeaf
        position={[0.15, 0.91, 0.01]}
        rotation={[-0.1, 0.24, -0.85]}
        scale={0.72}
      />
      {/* This group holds the entire flower head above the stem. */}
      <group
        position={[0, 1.42, 0]}
        rotation={bell ? [Math.PI, 0, 0] : [0, 0, 0]}
      >
        {/* One instanced mesh renders every petal with one geometry and material. */}
        <instancedMesh ref={petalMesh} args={[undefined, undefined, petals]}>
          {/* Bell flowers use cones; ordinary flowers preserve their existing shape. */}
          {bell ? (
            <coneGeometry args={[0.14, 0.36, 12]} />
          ) : (
            <sphereGeometry args={[0.22, 0.08, 0.08, 16, 8]} />
          )}
          {/* Render both sides and preserve the complete flower-level highlight. */}
          <meshStandardMaterial
            color={color}
            // Reuse the petal color as a gentle glow while targeted.
            emissive={highlighted ? color : "#000000"}
            // Zero removes the glow entirely from untargeted flowers.
            emissiveIntensity={highlighted ? 0.55 : 0}
            roughness={0.65}
            side={THREE.DoubleSide}
          />
        </instancedMesh>
        {/* Ordinary flowers receive a yellow center; bells remain hollow. */}
        {!bell && (
          <mesh position={[0, 0, 0.045]}>
            <sphereGeometry args={[0.13, 20, 12]} />
            <meshStandardMaterial color="#d8a83b" roughness={0.9} />
          </mesh>
        )}
      </group>
    </group>
  );
}
