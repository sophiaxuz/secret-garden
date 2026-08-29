// Vitest protects the island silhouette without requiring a WebGL renderer.
import { expect, test } from "vitest";
// Shared layout contains the visitor bounds and entrance position.
import { GARDEN_LAYOUT } from "../garden-layout";
// The pure polygon check exposes the shoreline's meaningful safety contract.
import { isInsideGardenShoreline } from "./garden-coastline";

// The sea may surround the garden but must never cut through explorable land.
test("the organic shoreline contains walking bounds and the entrance", () => {
  // All four visitor-bound corners must retain a generous land surface beneath them.
  const boundCorners = [
    [GARDEN_LAYOUT.bounds.minX, GARDEN_LAYOUT.bounds.minZ],
    [GARDEN_LAYOUT.bounds.minX, GARDEN_LAYOUT.bounds.maxZ],
    [GARDEN_LAYOUT.bounds.maxX, GARDEN_LAYOUT.bounds.minZ],
    [GARDEN_LAYOUT.bounds.maxX, GARDEN_LAYOUT.bounds.maxZ],
  ] as const;
  // Every legal extreme remains enclosed by the irregular coastal polygon.
  expect(boundCorners.every(isInsideGardenShoreline)).toBe(true);
  // The visitor's first camera location must still begin on the island, not at sea.
  expect(
    isInsideGardenShoreline([
      GARDEN_LAYOUT.entrance.x,
      GARDEN_LAYOUT.entrance.z,
    ]),
  ).toBe(true);
});
