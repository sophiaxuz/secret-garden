// Vitest protects the sea's relationship with live sky and weather data.
import { expect, test } from "vitest";
// The pure mapper keeps environmental behavior testable without WebGL shaders.
import { getSeaAtmosphere } from "./sea-atmosphere";

// A clear night should paint a stronger moon path than day or heavy cloud.
test("moon reflection follows light phase, horizon, and cloud cover", () => {
  // Moon position above the horizon gives the comparison a visible celestial source.
  const night = {
    phase: "night" as const,
    moonPosition: [10, 30, -20] as [number, number, number],
    moonIntensity: 0.32,
  };
  // Calm clear weather preserves most of the available moonlight.
  const clear = {
    cloudCover: 5,
    rainIntensity: 0,
    windSpeedKph: 7,
    windDirectionDegrees: 240,
  };
  // Compare the same Moon through dense cloud and during the daytime phase.
  const clearNight = getSeaAtmosphere(night, clear);
  const cloudyNight = getSeaAtmosphere(night, { ...clear, cloudCover: 96 });
  const daytime = getSeaAtmosphere({ ...night, phase: "day" }, clear);
  // Clear night retains a visibly stronger painted reflection than cloud.
  expect(clearNight.moonReflectionIntensity).toBeGreaterThan(
    cloudyNight.moonReflectionIntensity,
  );
  // Day removes the moon path completely even if a mathematical Moon is above us.
  expect(daytime.moonReflectionIntensity).toBe(0);
});

// Live wind and rain should energize the water while remaining within safe limits.
test("rough weather increases wave energy and speed", () => {
  // Twilight keeps color valid while reflection is irrelevant to this comparison.
  const time = {
    phase: "dusk" as const,
    moonPosition: [0, 20, 20] as [number, number, number],
    moonIntensity: 0.1,
  };
  // Compare a nearly still observation with a wet and windy one.
  const calm = getSeaAtmosphere(time, {
    cloudCover: 20,
    rainIntensity: 0,
    windSpeedKph: 2,
    windDirectionDegrees: 0,
  });
  const rough = getSeaAtmosphere(time, {
    cloudCover: 80,
    rainIntensity: 0.9,
    windSpeedKph: 35,
    windDirectionDegrees: 270,
  });
  // Weather should have a clear but bounded effect on both authored controls.
  expect(rough.waveEnergy).toBeGreaterThan(calm.waveEnergy);
  expect(rough.waveSpeed).toBeGreaterThan(calm.waveSpeed);
  expect(rough.waveEnergy).toBeLessThanOrEqual(1.75);
  // The converted horizontal wind vector always stays normalized.
  expect(Math.hypot(...rough.windDirection)).toBeCloseTo(1);
});

// The reported visual bug is a uniform blue sheet meeting a hard grey coast.
test("sea atmosphere contains depth, shoreline, and fine surface cues", () => {
  // Use a calm twilight observation matching the user's captured scene closely.
  const atmosphere = getSeaAtmosphere(
    {
      phase: "dusk",
      moonPosition: [8, 18, -24],
      moonIntensity: 0.12,
    },
    {
      cloudCover: 45,
      rainIntensity: 0,
      windSpeedKph: 5,
      windDirectionDegrees: 235,
    },
  );
  // The island edge needs a distinct translucent-looking shallow-water pigment.
  expect(atmosphere.shallowWaterColor).toBeDefined();
  expect(atmosphere.shallowWaterColor).not.toBe(atmosphere.waterColor);
  // Several metres of optical blending should replace the current hard border.
  expect(atmosphere.shoreBlendDistance).toBeGreaterThanOrEqual(1.5);
  // Even calm weather needs fine normal movement and occasional subdued foam.
  expect(atmosphere.microRippleStrength).toBeGreaterThan(0);
  expect(atmosphere.shoreFoamIntensity).toBeGreaterThan(0);
});
