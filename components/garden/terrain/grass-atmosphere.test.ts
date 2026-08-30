// Vitest protects the meadow's response to real UK weather observations.
import { expect, test } from "vitest";
// The pure atmosphere seam keeps weather rules independent from WebGL shaders.
import { getGrassAtmosphere } from "./grass-atmosphere";

// Strong wet weather should move the meadow more than a nearly still clear day.
test("wind and rain increase grass movement within restrained limits", () => {
  // A light northerly breeze provides the calm comparison.
  const calm = getGrassAtmosphere({
    windSpeedKph: 3,
    windDirectionDegrees: 0,
    rainIntensity: 0,
  });
  // A wet south-westerly wind should energize both sway and gust speed.
  const windy = getGrassAtmosphere({
    windSpeedKph: 34,
    windDirectionDegrees: 225,
    rainIntensity: 0.8,
  });
  // Weather must remain visibly influential without flattening the whole meadow.
  expect(windy.swayStrength).toBeGreaterThan(calm.swayStrength);
  expect(windy.gustSpeed).toBeGreaterThan(calm.gustSpeed);
  expect(windy.swayStrength).toBeLessThanOrEqual(0.24);
  // Direction remains normalized so shader displacement has stable magnitude.
  expect(Math.hypot(...windy.windDirection)).toBeCloseTo(1);
});

// Meteorological bearings describe where wind originates, not where it travels.
test("grass travels away from the reported wind bearing", () => {
  // A north wind must push blades south through the garden's negative Z axis.
  const northerly = getGrassAtmosphere({
    windSpeedKph: 12,
    windDirectionDegrees: 0,
    rainIntensity: 0,
  });
  // The horizontal X component remains centered for a cardinal north wind.
  expect(northerly.windDirection[0]).toBeCloseTo(0);
  // Negative Z aligns grass with the rain and the real direction of travel.
  expect(northerly.windDirection[1]).toBeCloseTo(-1);
});
