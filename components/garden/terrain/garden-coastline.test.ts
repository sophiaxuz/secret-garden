// Vitest protects the island silhouette without requiring a WebGL renderer.
import { expect, test } from "vitest";
// Shared layout contains the visitor bounds and complete path measurements.
import { GARDEN_LAYOUT } from "../garden-layout";
// The pure polygon check exposes the shoreline's meaningful safety contract.
import { isInsideGardenShoreline } from "./garden-coastline";

// The sea may surround the garden but must never cut through explorable land.
test("the organic shoreline contains walking bounds and both path ends", () => {
  // All four visitor-bound corners must retain a generous land surface beneath them.
  const boundCorners = [
    [GARDEN_LAYOUT.bounds.minX, GARDEN_LAYOUT.bounds.minZ],
    [GARDEN_LAYOUT.bounds.minX, GARDEN_LAYOUT.bounds.maxZ],
    [GARDEN_LAYOUT.bounds.maxX, GARDEN_LAYOUT.bounds.minZ],
    [GARDEN_LAYOUT.bounds.maxX, GARDEN_LAYOUT.bounds.maxZ],
  ] as const;
  // Every legal extreme remains enclosed by the irregular coastal polygon.
  expect(boundCorners.every(isInsideGardenShoreline)).toBe(true);
  // Calculate both ends from the same path center and length used by rendering.
  const pathEnds = [
    [0, GARDEN_LAYOUT.pathCenterZ + GARDEN_LAYOUT.pathLength / 2] as const,
    [0, GARDEN_LAYOUT.pathCenterZ - GARDEN_LAYOUT.pathLength / 2] as const,
  ];
  // The entrance and deep path ending must both land on the island, not the sea.
  expect(pathEnds.every(isInsideGardenShoreline)).toBe(true);
});
