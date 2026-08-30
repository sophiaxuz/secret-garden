// Vitest protects the full-capacity garden from returning to per-flower draw calls.
import { describe, expect, it } from "vitest";
// Shared capacity represents the largest supported visitor-created flower meadow.
import { GARDEN_LAYOUT } from "../../garden-layout";
// The pure batch plan is consumed by rendering and inspected without WebGL.
import { getPlantedFlowerBatchPlan } from "./planted-flower-batches";

// Batch planning should scale instance counts without scaling render operations.
describe("getPlantedFlowerBatchPlan", () => {
  // The maximum memory garden must remain a small fixed set of visible meshes.
  it("keeps 120 flowers within seven visible draw batches", () => {
    // Ask for the exact public capacity rather than an arbitrary sample size.
    const plan = getPlantedFlowerBatchPlan(
      GARDEN_LAYOUT.plantedFlowers.capacity,
    );

    // Every requested memory retains one stem and two distinct leaf blades.
    expect(plan.flowerCount).toBe(120);
    expect(plan.stemCount).toBe(120);
    expect(plan.leafCount).toBe(240);
    // Three petal families plus stems, leaves, and centers remain six batches.
    expect(plan.visibleBatchCount).toBeLessThanOrEqual(7);
    // The complete petal inventory stays aligned with authored per-flower counts.
    expect(
      Object.values(plan.petalCounts).reduce((sum, count) => sum + count, 0),
    ).toBeGreaterThan(plan.flowerCount * 6);
  });
});
