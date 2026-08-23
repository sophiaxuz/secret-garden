// Three supplies the scene-object type used by raycast intersection results.
import type * as THREE from "three";
// Every inspectable flower carries this small memory interface.
import type { FlowerMemory } from "./flower-memory";

// Walk from a hit mesh toward its parents until its flower group is found.
export function findFlowerMemory(
  object: THREE.Object3D | null,
): FlowerMemory | null {
  // Start with the exact mesh intersected by the visitor's ray.
  let current = object;
  // Parent links eventually end when the complete Three.js scene is reached.
  while (current) {
    // Flower.tsx stores its memory on the outer group's supported metadata object.
    const flower = current.userData.flower as FlowerMemory | undefined;
    // Return immediately once the containing flower has been found.
    if (flower) return flower;
    // Otherwise continue one level upward through the visible flower parts.
    current = current.parent;
  }
  // A null result means the selected scene object did not belong to a flower.
  return null;
}
