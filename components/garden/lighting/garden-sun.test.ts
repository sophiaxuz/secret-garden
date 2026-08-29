// Vitest checks the procedural solar texture without needing a WebGL renderer.
import { expect, test } from "vitest";
// The alpha seam expresses the visible disc-to-corona design in pure numbers.
import { getSunAlpha } from "./GardenSun";

// Protect the soft layered silhouette that replaced the former uniform sphere.
test("the Sun has a bright core and a feathered atmospheric corona", () => {
  // The solar centre remains fully luminous.
  expect(getSunAlpha(0)).toBe(1);
  // The visible edge softens into a lower-opacity inner glow.
  expect(getSunAlpha(0.14)).toBeCloseTo(0.36);
  // Crossing into the corona remains continuous, so no bright ring can appear.
  expect(getSunAlpha(0.140001)).toBeCloseTo(getSunAlpha(0.14), 4);
  // The outer atmosphere continues fading rather than ending as a hard circle.
  expect(getSunAlpha(0.5)).toBeGreaterThan(0);
  expect(getSunAlpha(0.5)).toBeLessThan(getSunAlpha(0.14));
  // No rectangular texture edge can appear around the completed corona.
  expect(getSunAlpha(1)).toBe(0);
});
