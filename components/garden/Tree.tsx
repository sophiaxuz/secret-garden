// The shared target hides tree registration, metadata, and cleanup.
import { GardenInteractionTarget } from "./interaction/GardenInteractionTarget";
// TreeItem prevents flower identity from crossing into this tree-only module.
import type { TreeItem } from "./interaction/garden-item";
// The shared trunk radius keeps visible bark aligned with physical collision.
import { TREE_TRUNK_RADIUS } from "./garden-trees";

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
  // The group makes the position and scale apply to every tree part.
  return (
    <group position={position} scale={scale}>
      {/* One target encloses the complete tree without registering each mesh. */}
      <GardenInteractionTarget
        item={item}
        position={[0, 2.8, 0]}
        size={[3.6, 5.8, 3.6]}
      />
      {/* A tapered cylinder becomes the trunk. */}
      <mesh position={[0, 2.1, 0]}>
        <cylinderGeometry args={[0.22, TREE_TRUNK_RADIUS, 4.2, 9]} />
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
