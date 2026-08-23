// Three supplies the scene-object type used by raycast intersection results.
import type * as THREE from "three";
// Every inspectable flower or tree exposes the same identity shape.
import type { GardenItem } from "./garden-item";

// Walk from a hit volume toward its parents until its garden identity is found.
export function findGardenItem(
  object: THREE.Object3D | null,
): GardenItem | null {
  // Start with the exact object intersected by the visitor's ray.
  let current = object;
  // Parent links eventually end when the complete Three.js scene is reached.
  while (current) {
    // Scene modules store identity on Three.js's supported metadata object.
    const item = current.userData.gardenItem as GardenItem | undefined;
    // Return immediately once the containing flower or tree has been found.
    if (item) return item;
    // Otherwise continue one level upward from the inexpensive hit volume.
    current = current.parent;
  }
  // A null result means the selected target did not carry garden identity.
  return null;
}
