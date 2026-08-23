// React supplies the child type and a post-render effect for scene traversal.
import { type ReactNode, useLayoutEffect, useRef } from "react";
// Three.js types let this cross-cutting policy recognize renderable meshes.
import { Group, Material, Mesh } from "three";

// Describe the world content and the value that signals newly planted meshes.
type GardenShadowGroupProps = {
  // Any physical scene objects can live beneath this shadow policy.
  children: ReactNode;
  // Changing this value reapplies the policy after procedural flora is added.
  refreshKey: number;
};

// Decide whether one material belongs to an invisible interaction hit volume.
function isInvisibleMaterial(material: Material): boolean {
  // Opacity lives on Three.js Material even when a specific shader subclass is used.
  return material.transparent && material.opacity <= 0.01;
}

// Apply one shadow policy without repeating castShadow on every animal body part.
export function GardenShadowGroup({
  children,
  refreshKey,
}: GardenShadowGroupProps) {
  // This reference exposes the mounted Three.js group after reconciliation.
  const groupRef = useRef<Group>(null);

  // Traverse after children mount so every physical mesh receives the policy.
  useLayoutEffect(() => {
    // The group can be absent during teardown, so guard before traversing it.
    if (!groupRef.current) return;
    // Visit every descendant, including instanced grass and nested animal parts.
    groupRef.current.traverse((object) => {
      // Lights, groups, and cameras do not have geometry that can cast a shadow.
      if (!(object instanceof Mesh)) return;
      // Normalize a single material and a material array into the same shape.
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      // Invisible hit targets must never produce mysterious rectangular shadows.
      const isInteractionTarget = materials.every(isInvisibleMaterial);
      // Terrain can explicitly opt out because broad planes should only receive.
      const optedOut = object.userData.shadowCaster === false;
      // All other visible garden meshes participate in celestial shadows.
      object.castShadow = !isInteractionTarget && !optedOut;
    });
  }, [refreshKey]);

  // The group adds no visual transform; it only defines the traversal boundary.
  return <group ref={groupRef}>{children}</group>;
}
