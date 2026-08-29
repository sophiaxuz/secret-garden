// Ten rows, six columns, and two sides define the memory-flower plot grid.
const PLANTED_FLOWER_ROWS = 10;
const PLANTED_FLOWER_COLUMNS = 6;
const PLANTED_FLOWER_SIDES = 2;

// Keep the garden's physical dimensions in one place so rendering and movement agree.
export const GARDEN_LAYOUT = {
  // The surrounding sea extends beyond the fog so its outer edge never appears.
  seaSize: 180,
  // A small drop keeps wave crests beneath the island's sandy shoreline.
  seaLevel: -0.38,
  // The path leads from the entrance into the deepest part of the garden.
  pathWidth: 2.4,
  pathLength: 42,
  pathCenterZ: -5,
  // These limits leave a natural border between visitors and the ground edge.
  bounds: {
    minX: -18,
    maxX: 18,
    minZ: -24,
    maxZ: 13,
  },
  // Begin near the path entrance at an average standing eye height.
  entrance: {
    x: 0,
    y: 1.62,
    z: 10.5,
  },
  // A slightly faster pace keeps the larger space pleasant to explore.
  walkingSpeed: 3.1,
  // These dimensions define every unique memory-flower plot and its capacity.
  plantedFlowers: {
    rows: PLANTED_FLOWER_ROWS,
    columns: PLANTED_FLOWER_COLUMNS,
    sides: PLANTED_FLOWER_SIDES,
    capacity:
      PLANTED_FLOWER_ROWS * PLANTED_FLOWER_COLUMNS * PLANTED_FLOWER_SIDES,
  },
} as const;
