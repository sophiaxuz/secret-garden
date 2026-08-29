// Vitest verifies the public animal activity rule without mounting WebGL.
import { expect, test } from "vitest";
// The shared seam prevents individual species disagreeing about nighttime.
import { getAnimalActivity } from "./animal-sleep";

// UK astronomical night is the only phase in which the whole garden settles.
test("animals sleep at night and wake for every lighter phase", () => {
  // Night must produce the sleeping state requested by the garden experience.
  expect(getAnimalActivity("night")).toBe("sleeping");
  // Dawn wakes the inhabitants as the first usable light returns.
  expect(getAnimalActivity("dawn")).toBe("awake");
  // Day keeps ordinary roaming behavior active.
  expect(getAnimalActivity("day")).toBe("awake");
  // Dusk remains awake until the astronomical phase actually becomes night.
  expect(getAnimalActivity("dusk")).toBe("awake");
});
