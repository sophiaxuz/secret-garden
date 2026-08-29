// Vitest verifies the public animal activity rule without mounting WebGL.
import { expect, test } from "vitest";
// The shared seam prevents individual species disagreeing about nighttime.
import {
  createFlyingSleepJourney,
  getAnimalActivity,
  getAnimalSleepAnchor,
} from "./animal-sleep";

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

// A stable anchor prevents sleeping bodies sliding home or teleporting at dawn.
test("sleep holds the current position and releases it on waking", () => {
  // The first sleeping frame captures the exact place reached by daytime movement.
  const captured = getAnimalSleepAnchor(null, true, [4, 0.3, -7]);
  // Later frames must retain that point even if another position is offered.
  expect(getAnimalSleepAnchor(captured, true, [12, 3, 9])).toEqual([
    4, 0.3, -7,
  ]);
  // Dawn releases the anchor so the paused route can resume from the same point.
  expect(getAnimalSleepAnchor(captured, false, [4, 0.3, -7])).toBeNull();
});

// Flying species must reach support before sleeping and return before resuming.
test("flying animals settle at a roost and wake without teleporting", () => {
  // Begin with a bird or butterfly currently crossing open air.
  const journey = createFlyingSleepJourney();
  const airborne = [3, 2.4, -5] as const;
  const roost = [1, 0.7, -4] as const;
  // Night first requests an awake settling flight toward physical support.
  expect(journey.update(true, airborne, roost)).toEqual({
    phase: "settling",
    target: roost,
  });
  // Only arrival at the roost permits the visible sleeping state.
  expect(journey.update(true, roost, roost)).toEqual({
    phase: "sleeping",
    target: roost,
  });
  // Dawn first returns toward the exact route point captured at nightfall.
  expect(journey.update(false, roost, roost)).toEqual({
    phase: "waking",
    target: airborne,
  });
  // Reaching that point releases the journey back to ordinary activity.
  expect(journey.update(false, airborne, roost)).toEqual({
    phase: "awake",
    target: null,
  });
});
