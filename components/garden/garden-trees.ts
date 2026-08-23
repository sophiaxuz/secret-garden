// The tree-specific interaction shape gives each tree a name and inspectable story.
import type { TreeItem } from "./interaction/garden-item";

// Every tree uses this unscaled trunk radius in both rendering and navigation.
export const TREE_TRUNK_RADIUS = 0.38;

// Named fields keep tree placement, scale, and identity together.
type GardenTree = {
  // Position stores x, y, and z coordinates in the scene.
  position: [number, number, number];
  // Scale varies the shared low-poly tree archetype.
  scale: number;
  // Item is the identity exposed by click, tap, and E-key inspection.
  item: TreeItem;
};

// These six elders form a loose ring around the walkable garden.
export const GARDEN_TREES = [
  {
    position: [-14, 0, 7],
    scale: 1.3,
    item: {
      kind: "tree",
      id: "threshold-oak",
      name: "Threshold oak",
      latinName: "Quercus robur",
      note: "Its branches hold the morning just inside the garden gate.",
    },
  },
  {
    position: [14, 0, 4],
    scale: 1.6,
    item: {
      kind: "tree",
      id: "sunward-beech",
      name: "Sunward beech",
      latinName: "Fagus sylvatica",
      note: "New leaves turn quietly toward every scrap of first light.",
    },
  },
  {
    position: [-12, 0, -7],
    scale: 1.55,
    item: {
      kind: "tree",
      id: "moss-oak",
      name: "Moss oak",
      latinName: "Quercus petraea",
      note: "A cool green world has gathered on the shaded side of its bark.",
    },
  },
  {
    position: [12, 0, -11],
    scale: 1.4,
    item: {
      kind: "tree",
      id: "pathkeeper-maple",
      name: "Pathkeeper maple",
      latinName: "Acer campestre",
      note: "It watches the path bend deeper than a visitor first expects.",
    },
  },
  {
    position: [-13.5, 0, -20],
    scale: 1.65,
    item: {
      kind: "tree",
      id: "deep-garden-rowan",
      name: "Deep-garden rowan",
      latinName: "Sorbus aucuparia",
      note: "Birdsong seems to linger here after the branches fall still.",
    },
  },
  {
    position: [13, 0, -21],
    scale: 1.5,
    item: {
      kind: "tree",
      id: "quiet-willow",
      name: "Quiet willow",
      latinName: "Salix caprea",
      note: "Stand close and the leaves sound almost like distant rain.",
    },
  },
] satisfies readonly GardenTree[];
