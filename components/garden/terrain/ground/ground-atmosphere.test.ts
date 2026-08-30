// Vitest protects the ground's visible response to real garden weather.
import { expect, test } from "vitest";
// The public atmosphere seam keeps material rules independent from WebGL.
import { getGroundAtmosphere } from "./ground-atmosphere";

// Rain should enrich the meadow floor without turning earth into polished plastic.
test("rain darkens the ground and softens roughness within natural limits", () => {
  // A dry summer day provides the matte baseline for comparison.
  const dry = getGroundAtmosphere(
    { phase: "day", season: "summer", environmentIntensity: 1 },
    { condition: "clear", rainIntensity: 0 },
  );
  // A strong shower should increase dampness while preserving broad roughness.
  const wet = getGroundAtmosphere(
    { phase: "day", season: "summer", environmentIntensity: 1 },
    { condition: "rain", rainIntensity: 0.85 },
  );
  // Damp soil reads darker than the same surface in dry weather.
  expect(wet.colorMultiplier).toBeLessThan(dry.colorMultiplier);
  // Water lowers microscopic roughness enough for restrained soft highlights.
  expect(wet.roughness).toBeLessThan(dry.roughness);
  // Even saturated organic ground must remain far from mirror-like values.
  expect(wet.roughness).toBeGreaterThanOrEqual(0.68);
  // Normalized wetness gives the shader a safe interpolation value.
  expect(wet.wetness).toBeGreaterThan(0.7);
  expect(wet.wetness).toBeLessThanOrEqual(1);
});
