// Vitest supplies the behavioral assertions for the cloud-drift seam.
import { expect, test } from "vitest";
// The public drift helper keeps moving cloud banks inside the garden sky.
import { advanceCloudPosition } from "./garden-clouds";

// Protect both ordinary movement and the invisible wrap beyond the horizon.
test("cloud banks drift continuously across the whole garden sky", () => {
  // A cloud in open sky advances by the exact wind distance.
  expect(advanceCloudPosition(0, 1.5)).toBe(1.5);
  // Crossing the hidden eastern boundary preserves overshoot beyond the west fog.
  expect(advanceCloudPosition(109, 3)).toBe(-108);
});
