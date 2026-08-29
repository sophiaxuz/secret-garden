// Vitest protects the squirrel's complete observable tree-climbing journey.
import { expect, test } from "vitest";
// Shared tree data prevents the test from inventing Moss oak coordinates.
import { getGardenTreeById } from "../../flora/garden-trees";
// Hazel's habitat names the real tree selected by production behavior.
import { ANIMAL_HABITATS } from "../animal-habitats";
// The public motion seam returns Hazel's world pose for any elapsed instant.
import { getSquirrelMotion } from "./squirrel-motion";

// Resolve the climb target through the same typed identity used by Hazel.
const CLIMB_TREE = getGardenTreeById(ANIMAL_HABITATS.squirrel.treeId);

// Protect every meaningful activity instead of individual animation calculations.
test("Hazel approaches, climbs, perches in, and descends from the Moss oak", () => {
  // Hazel begins grounded in the western foraging patch.
  const resting = getSquirrelMotion(0);
  // The approach carries her toward the tree without leaving the ground.
  const approaching = getSquirrelMotion(5);
  // Mid-climb must visibly lift her above a visitor's knees.
  const climbing = getSquirrelMotion(9);
  // The branch pause must place her unmistakably inside the tree.
  const perched = getSquirrelMotion(13);
  // The return down the trunk lowers her before the ground journey resumes.
  const descending = getSquirrelMotion(17.5);

  // Each sampled moment exposes truthful activity language to the renderer.
  expect(resting.phase).toBe("resting");
  expect(approaching.phase).toBe("approaching");
  expect(climbing.phase).toBe("climbing");
  expect(perched.phase).toBe("perched");
  expect(descending.phase).toBe("descending");
  // Ground travel permits a small bounding arc but never resembles tree climbing.
  expect(approaching.position[1]).toBeGreaterThanOrEqual(0.26);
  expect(approaching.position[1]).toBeLessThanOrEqual(0.4);
  // Climbing creates meaningful vertical travel rather than a ground-level label.
  expect(climbing.position[1]).toBeGreaterThan(1.5);
  // The Moss oak branch is high enough to read clearly beneath its canopy.
  expect(perched.position[1]).toBeGreaterThan(4);
  // Descent reverses that vertical journey toward the foot of the trunk.
  expect(descending.position[1]).toBeLessThan(climbing.position[1]);
  expect(descending.position[1]).toBeGreaterThan(0.26);
  // Mid-climb stays close enough for Hazel's paws to visibly meet the bark.
  const distanceFromTrunk = Math.hypot(
    climbing.position[0] - CLIMB_TREE.position[0],
    climbing.position[2] - CLIMB_TREE.position[2],
  );
  expect(distanceFromTrunk).toBeLessThan(0.8);
});

// Protect both branch boundaries from visible sideways teleportation.
test("Hazel moves continuously between the tapered trunk and branch", () => {
  // Sample one millisecond on either side of branch arrival.
  const beforePerch = getSquirrelMotion(10.999);
  const afterPerch = getSquirrelMotion(11.001);
  // Sample the equivalent boundary when the descent begins.
  const beforeDescent = getSquirrelMotion(14.999);
  const afterDescent = getSquirrelMotion(15.001);
  // Sample the internal handoff from branch transfer into trunk descent.
  const beforeTrunkDescent = getSquirrelMotion(15.799);
  const afterTrunkDescent = getSquirrelMotion(15.801);
  // Measure complete three-dimensional distance across one boundary.
  const distanceBetween = (
    first: typeof beforePerch.position,
    second: typeof afterPerch.position,
  ) =>
    Math.hypot(
      second[0] - first[0],
      second[1] - first[1],
      second[2] - first[2],
    );
  // Both transitions should move only a tiny frame-sized amount.
  expect(
    distanceBetween(beforePerch.position, afterPerch.position),
  ).toBeLessThan(0.02);
  expect(
    distanceBetween(beforeDescent.position, afterDescent.position),
  ).toBeLessThan(0.02);
  // Beginning the downward spiral must not create a one-frame lurch either.
  expect(
    distanceBetween(beforeTrunkDescent.position, afterTrunkDescent.position),
  ).toBeLessThan(0.02);
});

// Protect the handoff between changing foraging patches across consecutive climbs.
test("Hazel ends one tree visit where her next visit can begin", () => {
  // These distant points model two destinations selected by garden-wide roaming.
  const oldPatch = [-8, 0.26, 7] as const;
  const newPatch = [9, 0.26, -15] as const;
  // The final resting phase must already occupy the newly selected destination.
  const finishedVisit = getSquirrelMotion(25.9, oldPatch, newPatch);
  // The next cycle uses that same destination as its connected starting point.
  const nextVisit = getSquirrelMotion(0, newPatch, [-4, 0.26, 2]);
  // Matching positions prevent any visible teleport at the cycle boundary.
  expect(finishedVisit.position).toEqual(nextVisit.position);
});
