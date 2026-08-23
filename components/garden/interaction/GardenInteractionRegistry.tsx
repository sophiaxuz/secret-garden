// React context shares one registry between garden life and the interaction module.
import { createContext, useContext, useRef, type ReactNode } from "react";
// Three supplies the scene-object type stored as a raycast target.
import type * as THREE from "three";

// The registry exposes only the operations needed by scene life and raycasting.
export type GardenInteractionRegistry = {
  // Registration returns cleanup so removed life never leaves stale targets behind.
  register: (target: THREE.Object3D) => () => void;
  // Raycast only the registered hit volumes without traversing their children.
  raycast: (raycaster: THREE.Raycaster) => THREE.Intersection[];
};

// Build one mutable registry without requiring React state or rerenders.
export function createGardenInteractionRegistry(): GardenInteractionRegistry {
  // Keep the same array identity so callbacks see new targets without reattaching.
  const targets: THREE.Object3D[] = [];
  // Return the small interface shared by the provider, scene life, and raycaster.
  return {
    register(target) {
      // Add this object's inexpensive hit volume to the raycast-only list.
      targets.push(target);
      // Remove that exact object when its garden subject leaves the scene.
      return () => {
        // Locate the object at cleanup time because other registrations may change.
        const targetIndex = targets.indexOf(target);
        // Ignore repeated cleanup while removing each live registration once.
        if (targetIndex !== -1) targets.splice(targetIndex, 1);
      };
    },
    raycast(raycaster) {
      // Keep both the target collection and non-recursive search private.
      return raycaster.intersectObjects(targets, false);
    },
  };
}

// A null default lets the hook detect an incorrectly placed target immediately.
const GardenInteractionContext =
  createContext<GardenInteractionRegistry | null>(null);

// Provide one stable registry to the complete interactive garden subtree.
export function GardenInteractionRegistryProvider({
  children,
}: {
  // ReactNode accepts world and behavior modules without adding scene geometry.
  children: ReactNode;
}) {
  // Create the mutable registry once for the lifetime of this garden Canvas.
  const registry = useRef<GardenInteractionRegistry | null>(null);
  // Initialize during the first render so descendants can register immediately.
  if (!registry.current) registry.current = createGardenInteractionRegistry();
  // Context changes behavior without creating an extra Three.js group.
  return (
    <GardenInteractionContext.Provider value={registry.current}>
      {children}
    </GardenInteractionContext.Provider>
  );
}

// Give inspectable life and the raycaster access to the same narrow registry.
export function useGardenInteractionRegistry(): GardenInteractionRegistry {
  // Read the closest provider from the current React tree.
  const registry = useContext(GardenInteractionContext);
  // Fail close to a placement mistake instead of searching the complete scene.
  if (!registry) {
    throw new Error(
      "Garden interaction must be inside GardenInteractionRegistryProvider.",
    );
  }
  // Return the stable registry after confirming its provider exists.
  return registry;
}
