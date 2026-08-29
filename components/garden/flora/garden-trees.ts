// The tree-specific interaction shape gives each tree a name and inspectable story.
import type { TreeItem } from "../interaction/garden-item";

// Every tree uses this unscaled trunk radius in both rendering and navigation.
export const TREE_TRUNK_RADIUS = 0.38;
// The narrower top radius defines the same tapered bark used by climbing motion.
export const TREE_TRUNK_TOP_RADIUS = 0.22;
// Trunk height is shared by rendering and height-sensitive animal contact.
export const TREE_TRUNK_HEIGHT = 4.2;
// Every tree shares one low branch where birds or squirrels can visibly pause.
export const TREE_BRANCH_LOCAL_POSITION = [0.62, 2.9, 0] as const;
// The branch reaches from the trunk toward the positive local X direction.
export const TREE_BRANCH_LENGTH = 1.35;
// This point sits near the outer branch while remaining beneath the canopy.
export const TREE_BRANCH_PERCH_LOCAL_POSITION = [1.05, 3.05, 0] as const;

// One compact style object gives each named tree its own botanical character.
export type TreeVisualStyle = {
  // Three related greens create depth across the layered crown.
  readonly foliage: readonly [string, string, string];
  // Crown scale changes width, height, and depth without changing collision.
  readonly crownScale: readonly [number, number, number];
  // Optional tiny fruit or blossom points add species-specific detail.
  readonly accent?: string;
};

// Named fields keep tree placement, scale, and identity together.
export type GardenTree = {
  // Position stores x, y, and z coordinates in the scene.
  readonly position: readonly [number, number, number];
  // Scale varies the shared low-poly tree archetype.
  scale: number;
  // Item is the identity exposed by click, tap, and E-key inspection.
  item: TreeItem;
  // Visual data separates species character from shared tree construction.
  visual: TreeVisualStyle;
};

// These six elders form a loose ring around the walkable garden.
export const GARDEN_TREES = [
  {
    position: [-16.2, 0, 9.3],
    scale: 1.3,
    item: {
      kind: "tree",
      id: "threshold-oak",
      name: "Threshold oak",
      latinName: "Quercus robur",
      note: "Its branches hold the morning just inside the garden gate.",
    },
    visual: {
      foliage: ["#47704b", "#5c865c", "#789a70"],
      crownScale: [1.18, 0.95, 1.08],
    },
  },
  {
    position: [16.2, 0, 6.5],
    scale: 1.6,
    item: {
      kind: "tree",
      id: "sunward-beech",
      name: "Sunward beech",
      latinName: "Fagus sylvatica",
      note: "New leaves turn quietly toward every scrap of first light.",
    },
    visual: {
      foliage: ["#547753", "#708f61", "#8da576"],
      crownScale: [1.05, 1.12, 1.02],
    },
  },
  {
    position: [-15.5, 0, -5],
    scale: 1.55,
    item: {
      kind: "tree",
      id: "moss-oak",
      name: "Moss oak",
      latinName: "Quercus petraea",
      note: "A cool green world has gathered on the shaded side of its bark.",
    },
    visual: {
      foliage: ["#416b50", "#598063", "#789778"],
      crownScale: [1.2, 0.92, 1.14],
    },
  },
  {
    position: [15.5, 0, -8.5],
    scale: 1.4,
    item: {
      kind: "tree",
      id: "pathkeeper-maple",
      name: "Meadowkeeper maple",
      latinName: "Acer campestre",
      note: "It watches the meadow deepen farther than a visitor first expects.",
    },
    visual: {
      foliage: ["#5b7244", "#778652", "#98945f"],
      crownScale: [1.02, 1.08, 1.04],
      accent: "#9a623c",
    },
  },
  {
    position: [-16, 0, -22],
    scale: 1.65,
    item: {
      kind: "tree",
      id: "deep-garden-rowan",
      name: "Deep-garden rowan",
      latinName: "Sorbus aucuparia",
      note: "Birdsong seems to linger here after the branches fall still.",
    },
    visual: {
      foliage: ["#536a47", "#70835a", "#8ea071"],
      crownScale: [0.94, 1.16, 0.92],
      accent: "#a84f39",
    },
  },
  {
    position: [16, 0, -22.5],
    scale: 1.5,
    item: {
      kind: "tree",
      id: "quiet-willow",
      name: "Quiet willow",
      latinName: "Salix caprea",
      note: "Stand close and the leaves sound almost like distant rain.",
    },
    visual: {
      foliage: ["#526f61", "#6d8874", "#91a28b"],
      crownScale: [1.08, 1.28, 1.06],
    },
  },
] as const satisfies readonly GardenTree[];

// Derive the only valid tree identity strings directly from the garden data.
export type GardenTreeId = (typeof GARDEN_TREES)[number]["item"]["id"];

// Find one named tree or fail loudly when a cross-module habitat becomes stale.
export function getGardenTreeById(id: GardenTreeId): GardenTree {
  // Tree identities are the stable link used by animal behavior.
  const tree = GARDEN_TREES.find((candidate) => candidate.item.id === id);
  // A missing target would otherwise place an animal at an invented coordinate.
  if (!tree) throw new Error(`Garden tree "${id}" does not exist.`);
  // Return the complete placement, scale, and identity through one interface.
  return tree;
}
