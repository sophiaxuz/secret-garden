// Shared capacity and bounds keep generated flower plots aligned with the world.
import { GARDEN_LAYOUT } from "../garden-layout";

// Find one visitor-created flower's stable place in the spacious island meadow.
export function getPlantedFlowerPosition(
  index: number,
): [number, number, number] {
  // Two consecutive flowers share a loose row on opposite sides of the clearing.
  const pairIndex = Math.floor(index / 2);
  // Ten rows distribute memories from the entrance into the garden's deep end.
  const row = pairIndex % GARDEN_LAYOUT.plantedFlowers.rows;
  // Later pairs expand into additional columns rather than stacking in one clump.
  const column =
    Math.floor(pairIndex / GARDEN_LAYOUT.plantedFlowers.rows) %
    GARDEN_LAYOUT.plantedFlowers.columns;
  // Alternate east and west while preserving the center as open breathing space.
  const side = index % GARDEN_LAYOUT.plantedFlowers.sides ? 1 : -1;
  // Offset alternating rows and columns to avoid an obvious plantation-like grid.
  const x = side * (4.4 + column * 1.85 + (row % 2) * 0.3);
  // A second stagger prevents straight horizontal lines across the meadow.
  const z = 10 - row * 3.55 + (column % 2) * 0.55;
  // Ground every generated flower at the same island surface height.
  return [x, 0, z];
}
