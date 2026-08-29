// Vitest supplies the behavior-focused assertions for the public time interface.
import { expect, test } from "vitest";
// This seam converts one absolute instant into the complete UK garden time state.
import { getUkGardenTime } from "./uk-garden-time";

// Protect British Summer Time and the UK's strongly seasonal midday sun height.
test("UK garden time follows daylight saving and seasonal daylight", () => {
  // Summer noon UTC is one o'clock locally while British Summer Time is active.
  const summer = getUkGardenTime(new Date("2026-06-21T12:00:00.000Z"));
  // Winter noon UTC remains noon locally under Greenwich Mean Time.
  const winter = getUkGardenTime(new Date("2026-12-21T12:00:00.000Z"));
  // The displayed clock must use the UK civil timezone rather than browser locale.
  expect(summer.timeLabel).toBe("13:00:00");
  expect(winter.timeLabel).toBe("12:00:00");
  // The calendar season gives visitors a readable sense of the UK year.
  expect(summer.season).toBe("summer");
  expect(winter.season).toBe("winter");
  // Both instants are daylight, but London's summer sun must stand much higher.
  expect(summer.phase).toBe("day");
  expect(winter.phase).toBe("day");
  expect(summer.sunPosition[1]).toBeGreaterThan(winter.sunPosition[1] * 2);
});

// A clear summer noon should produce high-key illumination, not muted overcast light.
test("summer midday gives the garden bright layered daylight", () => {
  // Pin the instant near London's highest annual Sun for a deterministic baseline.
  const midday = getUkGardenTime(new Date("2026-06-21T12:00:00.000Z"));
  // Direct sunlight must be strong enough to create crisp readable form and shadow.
  expect(midday.sunIntensity).toBeGreaterThanOrEqual(3.2);
  // Sky fill must keep the shaded side of trees and animals visibly colourful.
  expect(midday.hemisphereIntensity).toBeGreaterThanOrEqual(1.25);
  // Reflected environmental light prevents the whole meadow from reading grey-green.
  expect(midday.environmentIntensity).toBeGreaterThanOrEqual(1);
});

// A summer midnight checks that the Moon takes over the garden after sunset.
test("moonlight replaces sunlight during a UK night", () => {
  // At this instant, London observes British Summer Time, one hour ahead of UTC.
  const night = getUkGardenTime(new Date("2026-06-21T00:00:00.000Z"));
  // The displayed clock must remain UK-local even when its input is UTC.
  expect(night.timeLabel).toBe("01:00:00");
  // Midnight in London should place the garden in its night phase.
  expect(night.phase).toBe("night");
  // The Sun belongs below the horizon while the opposing Moon is visible above it.
  expect(night.sunPosition[1]).toBeLessThan(0);
  expect(night.moonPosition[1]).toBeGreaterThan(0);
  // Moonlight becomes the dominant directional light once daylight has disappeared.
  expect(night.moonIntensity).toBeGreaterThan(night.sunIntensity);
  // Daytime improvements must not recolour the established night rendering.
  expect(night.hemisphereGroundColor).toBe("#17251e");
});
