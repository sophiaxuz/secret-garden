// The garden limit prevents a caller from planning duplicate flower plots.
import { GARDEN_LAYOUT } from "../../garden-layout";
// Planted memories intentionally use only lightweight open-flower profiles.
import type { FlowerPetalProfile } from "../flower-petal-shape";

// This stable cycle gives unidentified memories visual variety without false species.
export const PLANTED_FLOWER_PROFILES = [
  "meadow",
  "cosmos",
  "buttercup",
] as const satisfies readonly FlowerPetalProfile[];

// A batch plan exposes performance-relevant counts separately from Three.js objects.
export type PlantedFlowerBatchPlan = {
  flowerCount: number;
  stemCount: number;
  leafCount: number;
  petalCounts: Record<(typeof PLANTED_FLOWER_PROFILES)[number], number>;
  visibleBatchCount: number;
};

// Count the instances needed by six fixed visible batches at any supported capacity.
export function getPlantedFlowerBatchPlan(
  requestedCount: number,
): PlantedFlowerBatchPlan {
  // Clamp malformed or excessive values before allocating renderer buffers.
  const flowerCount = Math.max(
    0,
    Math.min(Math.floor(requestedCount), GARDEN_LAYOUT.plantedFlowers.capacity),
  );
  // Begin each profile at zero so even an empty family retains stable typing.
  const petalCounts = { meadow: 0, cosmos: 0, buttercup: 0 };
  // Match the exact profile and petal cycle used by the visible field renderer.
  for (let index = 0; index < flowerCount; index += 1) {
    // Each memory cycles through one of three honest procedural archetypes.
    const profile =
      PLANTED_FLOWER_PROFILES[index % PLANTED_FLOWER_PROFILES.length];
    // Seven through nine petals create small individual rhythm inside each batch.
    petalCounts[profile] += 7 + (index % 3);
  }
  // Stems, leaves, centers, and three petal families create six visible meshes.
  return {
    flowerCount,
    stemCount: flowerCount,
    leafCount: flowerCount * 2,
    petalCounts,
    visibleBatchCount: flowerCount === 0 ? 0 : 6,
  };
}
