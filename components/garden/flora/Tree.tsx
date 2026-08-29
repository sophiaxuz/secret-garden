// The shared target hides tree registration, identity, and cleanup.
import { GardenInteractionTarget } from "../interaction/GardenInteractionTarget";
// TreeItem prevents flower identity from crossing into this tree-only module.
import type { TreeItem } from "../interaction/garden-item";
// TreeCrown owns species color, layered volume, leaves, and small accents.
import { TreeCrown } from "./TreeCrown";
// Shared visual data keeps named-tree character beside placement data.
import type { TreeVisualStyle } from "./garden-trees";
// TreeStructure owns textured bark, roots, trunk, and physical branches.
import { TreeStructure } from "./TreeStructure";

// These values are the complete interface needed to place one named tree.
type TreeProps = {
  // Position stores world x, y, and z coordinates.
  position: readonly [number, number, number];
  // Scale varies the complete shared tree construction.
  scale?: number;
  // Item gives the tree its inspectable name, species, and story.
  item: TreeItem;
  // Style gives this species a distinctive crown palette and proportion.
  visual: TreeVisualStyle;
  // The targeted tree receives a soft whole-tree glow.
  highlighted?: boolean;
};

// Compose one detailed tree from cohesive woody and leafy modules.
export function Tree({
  position,
  scale = 1,
  item,
  visual,
  highlighted = false,
}: TreeProps) {
  // One parent transform keeps interaction, structure, and crown aligned.
  return (
    <group position={[...position]} scale={scale}>
      {/* A single inexpensive volume represents the complete detailed asset. */}
      <GardenInteractionTarget
        item={item}
        position={[0, 2.9, 0]}
        size={[4.4, 6.2, 4.4]}
      />
      {/* Textured roots and branches establish the tree's physical structure. */}
      <TreeStructure highlighted={highlighted} />
      {/* Layered foliage completes its species-specific silhouette. */}
      <TreeCrown style={visual} highlighted={highlighted} />
    </group>
  );
}
