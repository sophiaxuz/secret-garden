// Vitest verifies garden-wide roaming without mounting WebGL or React.
import { expect, test } from "vitest";
// Garden bounds define the complete area destinations are allowed to explore.
import { GARDEN_LAYOUT } from "../../garden-layout";
// Tree footprints protect animals from choosing rest points inside bark.
import { GARDEN_TREES, TREE_TRUNK_RADIUS } from "../../flora/garden-trees";
// The route planner is the narrow behavior seam exercised by these tests.
import { createAnimalRoamingRoute } from "./animal-roaming";

// Roaming should visibly use the large garden rather than another tiny local loop.
test("successive destinations safely spread across the whole garden", () => {
  // A fixed seed makes the test repeatable while matching a real mounted animal.
  const route = createAnimalRoamingRoute(42, [-9.5, 0.46, 8.3]);
  // Twenty-four decisions are enough to demonstrate broad long-term coverage.
  const points = Array.from({ length: 24 }, (_, index) => route.point(index));
  // Every point must remain within the visitor's explorable world bounds.
  for (const point of points) {
    expect(point.x).toBeGreaterThan(GARDEN_LAYOUT.bounds.minX);
    expect(point.x).toBeLessThan(GARDEN_LAYOUT.bounds.maxX);
    expect(point.z).toBeGreaterThan(GARDEN_LAYOUT.bounds.minZ);
    expect(point.z).toBeLessThan(GARDEN_LAYOUT.bounds.maxZ);
    // Resting destinations must remain visibly outside each rendered trunk.
    for (const tree of GARDEN_TREES) {
      const distance = Math.hypot(
        point.x - tree.position[0],
        point.z - tree.position[2],
      );
      expect(distance).toBeGreaterThan(TREE_TRUNK_RADIUS * tree.scale);
    }
  }
  // Measure how much of each garden dimension the chosen destinations cover.
  const xValues = points.map(({ x }) => x);
  const zValues = points.map(({ z }) => z);
  // Broad spans prevent a future refactor from quietly restoring local patrols.
  expect(Math.max(...xValues) - Math.min(...xValues)).toBeGreaterThan(28);
  expect(Math.max(...zValues) - Math.min(...zValues)).toBeGreaterThan(28);
});

// A route must not change its mind while an animal is already walking toward it.
test("the same seed and waypoint index retain stable destinations", () => {
  // Separate planners model remounts with the same supplied personality seed.
  const first = createAnimalRoamingRoute(91, [8, 0.26, 4.8]);
  const second = createAnimalRoamingRoute(91, [8, 0.26, 4.8]);
  // Resolving later points in different orders must still yield identical positions.
  const destination = first.point(7).toArray();
  second.point(3);
  expect(second.point(7).toArray()).toEqual(destination);
});
