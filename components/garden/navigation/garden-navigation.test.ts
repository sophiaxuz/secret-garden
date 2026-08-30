// Vitest supplies the test and equality assertion functions.
import { expect, test } from "vitest";
// Shared layout keeps edge assertions synchronized with the explorable world.
import { GARDEN_LAYOUT } from "../garden-layout";
// Rendered tree data keeps collision tests synchronized with moved landmarks.
import { GARDEN_TREES, TREE_TRUNK_RADIUS } from "../flora/garden-trees";
// This public navigation rule keeps movement within the explorable habitat.
import {
  keepVisitorInsideGarden,
  shouldRegressGardenQuality,
} from "./garden-navigation";

// Test the first named tree without copying its mutable world coordinates.
const THRESHOLD_OAK = GARDEN_TREES[0];
// Navigation gives the camera this body radius around visible scaled bark.
const EXPECTED_CLEARANCE = TREE_TRUNK_RADIUS * THRESHOLD_OAK.scale + 0.34;

// Protect every visitor-facing boundary rather than the Three.js camera implementation.
test("walking beyond any garden edge stops at the boundary", () => {
  // Use a known point beyond both the eastern and deep edges of the habitat.
  const easternDeepPosition = { x: 21, z: -29 };
  // Use another point beyond both the western and entrance-facing edges.
  const westernEntrancePosition = { x: -30, z: 40 };
  // Apply the same navigation rule used by the live first-person camera.
  keepVisitorInsideGarden(easternDeepPosition);
  keepVisitorInsideGarden(westernEntrancePosition);
  // The expected coordinates are the garden's independently agreed visible limits.
  expect([easternDeepPosition, westernEntrancePosition]).toEqual([
    { x: GARDEN_LAYOUT.bounds.maxX, z: GARDEN_LAYOUT.bounds.minZ },
    { x: GARDEN_LAYOUT.bounds.minX, z: GARDEN_LAYOUT.bounds.maxZ },
  ]);
});

// Protect the physical promise that a visitor cannot walk through a tree trunk.
test("walking into a tree stops outside its trunk", () => {
  // Place the visitor inside the threshold oak's visible trunk footprint.
  const attemptedPosition = {
    x: THRESHOLD_OAK.position[0] - 0.2,
    z: THRESHOLD_OAK.position[2],
  };
  // Apply the exact navigation rule called after every live camera movement.
  keepVisitorInsideGarden(attemptedPosition);
  // Measure the visitor's resolved horizontal distance from the tree centre.
  const distanceFromTree = Math.hypot(
    attemptedPosition.x - THRESHOLD_OAK.position[0],
    attemptedPosition.z - THRESHOLD_OAK.position[2],
  );
  // The camera body and trunk together need roughly this much clear space.
  expect(distanceFromTree).toBeGreaterThanOrEqual(EXPECTED_CLEARANCE);
});

// Protect against frame delays that could otherwise jump completely through a tree.
test("a long movement step cannot tunnel through a tree", () => {
  // Start safely west of the threshold oak's collision footprint.
  const previousPosition = {
    x: THRESHOLD_OAK.position[0] - EXPECTED_CLEARANCE - 0.7,
    z: THRESHOLD_OAK.position[2],
  };
  // Attempt to cross the entire trunk in one unusually long animation frame.
  const attemptedPosition = {
    x: THRESHOLD_OAK.position[0] + EXPECTED_CLEARANCE + 0.7,
    z: THRESHOLD_OAK.position[2],
  };
  // Supply both ends of the real movement segment to continuous collision handling.
  keepVisitorInsideGarden(attemptedPosition, previousPosition);
  // The visitor must remain on the approach side rather than appearing past the oak.
  expect(attemptedPosition.x).toBeLessThan(
    THRESHOLD_OAK.position[0] - EXPECTED_CLEARANCE,
  );
  // A straight approach has no sideways component, so Z should remain unchanged.
  expect(attemptedPosition.z).toBeCloseTo(THRESHOLD_OAK.position[2]);
});

// Protect recovery when saved and attempted positions coincide at a trunk centre.
test("an exact tree-centre position recovers in a stable direction", () => {
  // Simulate a camera restored at the exact centre of the threshold oak.
  const previousPosition = {
    x: THRESHOLD_OAK.position[0],
    z: THRESHOLD_OAK.position[2],
  };
  // Keep a separate attempted object to match the live movement API.
  const attemptedPosition = {
    x: THRESHOLD_OAK.position[0],
    z: THRESHOLD_OAK.position[2],
  };
  // Resolve the otherwise directionless penetration through the navigation seam.
  keepVisitorInsideGarden(attemptedPosition, previousPosition);
  // The deterministic eastward fallback must move the visitor clear of the trunk.
  expect(attemptedPosition.x).toBeGreaterThan(
    THRESHOLD_OAK.position[0] + EXPECTED_CLEARANCE,
  );
  // Recovery should not introduce an arbitrary north-south jump.
  expect(attemptedPosition.z).toBeCloseTo(THRESHOLD_OAK.position[2]);
});

// Camera motion should request temporary resolution relief from the renderer.
test("walking or looking triggers adaptive garden quality", () => {
  // A still camera should retain full resting detail without needless regression calls.
  expect(shouldRegressGardenQuality(0, 0, 0)).toBe(false);
  // Keyboard motion and pointer rotation each exercise the exact live decision seam.
  expect(shouldRegressGardenQuality(1, 0, 0)).toBe(true);
  expect(shouldRegressGardenQuality(0, -1, 0)).toBe(true);
  expect(shouldRegressGardenQuality(0, 0, 0.002)).toBe(true);
});

// Continuous movement should extend reduced quality without per-frame timer churn.
test("adaptive quality receives a steady heartbeat throughout movement", () => {
  // A request made too soon is skipped because the existing debounce remains alive.
  expect(shouldRegressGardenQuality(1, 0, 0, 0.1)).toBe(false);
  // A later request refreshes the debounce before full resolution can return.
  expect(shouldRegressGardenQuality(1, 0, 0, 0.15)).toBe(true);
  // Stillness never extends reduced quality, however much time has passed.
  expect(shouldRegressGardenQuality(0, 0, 0, 10)).toBe(false);
});
