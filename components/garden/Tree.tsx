// Layout effects register the tree's hit volume after its scene mesh mounts.
import { useLayoutEffect, useRef } from "react";
// Three supplies the mesh type stored by the interaction-target ref.
import * as THREE from "three";
// The generic registry keeps tree interaction out of whole-scene raycasting.
import { useGardenInteractionRegistry } from "./interaction/GardenInteractionRegistry";
// TreeItem prevents flower identity from crossing into this tree-only module.
import type { TreeItem } from "./interaction/garden-item";

// These values let the world place and resize each tree.
type TreeProps = {
  // The tuple represents x, y, and z coordinates in the scene.
  position: [number, number, number];
  // Scale is optional because most trees can use their natural size.
  scale?: number;
  // Item gives the tree its inspectable name, species, and story.
  item: TreeItem;
  // The targeted tree receives a soft canopy glow.
  highlighted?: boolean;
};

// Build a stylized low-poly tree from a trunk and two leaf clusters.
export function Tree({
  position,
  scale = 1,
  item,
  highlighted = false,
}: TreeProps) {
  // Read the target registry shared by the complete interactive garden.
  const interactionRegistry = useGardenInteractionRegistry();
  // This ref exposes one inexpensive box used only for tree raycasting.
  const interactionTarget = useRef<THREE.Mesh>(null);

  // Register the tree hit volume only while this tree exists in the scene.
  useLayoutEffect(() => {
    // Stop until React has connected the invisible mesh to the ref.
    if (!interactionTarget.current) return;
    // Return registration cleanup directly for React to call on unmount.
    return interactionRegistry.register(interactionTarget.current);
  }, [interactionRegistry]);

  // The group makes the position and scale apply to every tree part.
  return (
    <group position={position} scale={scale} userData={{ gardenItem: item }}>
      {/* One hidden box represents the complete tree to the raycaster cheaply. */}
      <mesh ref={interactionTarget} position={[0, 2.8, 0]} visible={false}>
        {/* The volume includes trunk and canopy without registering each mesh. */}
        <boxGeometry args={[3.6, 5.8, 3.6]} />
        {/* Mesh raycasting needs a material even though it is never rendered. */}
        <meshBasicMaterial />
      </mesh>
      {/* A tapered cylinder becomes the trunk. */}
      <mesh position={[0, 2.1, 0]}>
        <cylinderGeometry args={[0.22, 0.38, 4.2, 9]} />
        <meshStandardMaterial
          color="#3a3b28"
          emissive={highlighted ? "#756f46" : "#000000"}
          emissiveIntensity={highlighted ? 0.24 : 0}
          roughness={1}
        />
      </mesh>
      {/* A large faceted shape forms the main canopy. */}
      <mesh position={[0, 4.2, 0]}>
        <dodecahedronGeometry args={[1.65, 1]} />
        <meshStandardMaterial
          color="#294c35"
          emissive={highlighted ? "#70935f" : "#000000"}
          emissiveIntensity={highlighted ? 0.4 : 0}
          roughness={1}
        />
      </mesh>
      {/* A smaller offset canopy prevents a perfectly symmetrical silhouette. */}
      <mesh position={[-0.9, 4, 0.2]}>
        <dodecahedronGeometry args={[1.05, 1]} />
        <meshStandardMaterial
          color="#365c3c"
          emissive={highlighted ? "#83a86b" : "#000000"}
          emissiveIntensity={highlighted ? 0.4 : 0}
          roughness={1}
        />
      </mesh>
    </group>
  );
}
