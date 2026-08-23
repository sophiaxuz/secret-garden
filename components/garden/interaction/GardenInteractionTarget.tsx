// Layout effects register a hit volume only after Three.js creates its mesh.
import { useLayoutEffect, useRef } from "react";
// Three supplies the concrete mesh type retained by the registration ref.
import * as THREE from "three";
// This hook reaches the one target registry shared by the complete garden.
import { useGardenInteractionRegistry } from "./GardenInteractionRegistry";
// Every hit volume carries one discriminated flower, tree, or animal identity.
import type { GardenItem } from "./garden-item";

// Three coordinates describe a local position or box size in X, Y, and Z order.
type VectorTuple = readonly [number, number, number];

// This small interface hides target registration, geometry, metadata, and cleanup.
type GardenInteractionTargetProps = {
  // Item is returned when the visitor's ray intersects this volume.
  item: GardenItem;
  // Position aligns the hit volume with visible geometry inside its parent group.
  position?: VectorTuple;
  // Size encloses the visible subject without registering its individual meshes.
  size: VectorTuple;
  // Highlighted subjects receive one temporary warm light nearby.
  highlighted?: boolean;
};

// Render and register one inexpensive target that follows its transformed parent.
export function GardenInteractionTarget({
  item,
  position = [0, 0, 0],
  size,
  highlighted = false,
}: GardenInteractionTargetProps) {
  // Read the stable registry shared by scene life and the central raycaster.
  const interactionRegistry = useGardenInteractionRegistry();
  // Retain the exact mesh that should enter and later leave the registry.
  const interactionTarget = useRef<THREE.Mesh>(null);

  // Register this volume for exactly as long as it exists in the scene.
  useLayoutEffect(() => {
    // Wait until React Three Fiber has connected the mesh to the ref.
    if (!interactionTarget.current) return;
    // Registration returns the matching cleanup used during unmount.
    return interactionRegistry.register(interactionTarget.current);
  }, [interactionRegistry]);

  // Return behavior geometry that inherits every parent movement and scale.
  return (
    <>
      {/* The hidden box carries identity directly and remains raycastable. */}
      <mesh
        ref={interactionTarget}
        position={[position[0], position[1], position[2]]}
        visible={false}
        userData={{ gardenItem: item }}
      >
        {/* Copy readonly configuration into the mutable tuple expected by Three.js. */}
        <boxGeometry args={[size[0], size[1], size[2]]} />
        {/* Mesh raycasting requires a material even though rendering skips it. */}
        <meshBasicMaterial />
      </mesh>
      {/* Only the currently targeted moving subject creates this gentle glow. */}
      {highlighted && (
        <pointLight
          position={[position[0], position[1], position[2]]}
          color="#f3d98c"
          intensity={1.8}
          distance={2.6}
          decay={2}
        />
      )}
    </>
  );
}
