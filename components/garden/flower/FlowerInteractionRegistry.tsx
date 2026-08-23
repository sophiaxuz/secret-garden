// React context shares one registry between flowers and the interaction module.
import { createContext, useContext, useRef, type ReactNode } from "react";
// Three supplies the scene-object type stored as a raycast target.
import type * as THREE from "three";

// The registry exposes the exact objects that flower interaction may raycast.
export type FlowerInteractionRegistry = {
  // Registration returns cleanup so removed flowers never leave stale targets behind.
  register: (target: THREE.Object3D) => () => void;
  // Raycast only the registered hit volumes without traversing their children.
  raycast: (raycaster: THREE.Raycaster) => THREE.Intersection[];
};

// Build one mutable registry without requiring React state or rerenders.
export function createFlowerInteractionRegistry(): FlowerInteractionRegistry {
  // Keep the same array identity so callbacks can read new targets without reattaching.
  const targets: THREE.Object3D[] = [];
  // Return the small interface shared by the provider, flowers, and raycaster.
  return {
    register(target) {
      // Add this flower's simple hit volume to the raycast-only list.
      targets.push(target);
      // Remove that exact object when its flower leaves the scene.
      return () => {
        // Locate the object at cleanup time because other flowers may have changed.
        const targetIndex = targets.indexOf(target);
        // Ignore repeated cleanup while removing every live registration exactly once.
        if (targetIndex !== -1) targets.splice(targetIndex, 1);
      };
    },
    raycast(raycaster) {
      // Keep both the target collection and the non-recursive search private.
      return raycaster.intersectObjects(targets, false);
    },
  };
}

// A null default lets the hook detect an incorrectly placed flower immediately.
const FlowerInteractionContext =
  createContext<FlowerInteractionRegistry | null>(null);

// Provide one stable registry to the complete interactive flower subtree.
export function FlowerInteractionRegistryProvider({
  children,
}: {
  // ReactNode accepts the world and interaction modules without adding scene geometry.
  children: ReactNode;
}) {
  // Create the mutable registry once for the lifetime of this garden Canvas.
  const registry = useRef<FlowerInteractionRegistry | null>(null);
  // Initialize during the first render so descendants can register immediately.
  if (!registry.current) registry.current = createFlowerInteractionRegistry();
  // Context changes behavior without creating an extra Three.js group.
  return (
    <FlowerInteractionContext.Provider value={registry.current}>
      {children}
    </FlowerInteractionContext.Provider>
  );
}

// Give flowers and the raycaster access to the same narrow target registry.
export function useFlowerInteractionRegistry(): FlowerInteractionRegistry {
  // Read the closest provider from the current React tree.
  const registry = useContext(FlowerInteractionContext);
  // Fail close to the mistake instead of silently searching the complete scene again.
  if (!registry) {
    throw new Error(
      "Flower interaction must be inside FlowerInteractionRegistryProvider.",
    );
  }
  // Return the stable registry after confirming the required provider exists.
  return registry;
}
