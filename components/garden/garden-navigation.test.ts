// Vitest supplies the test and equality assertion functions.
import { expect, test } from "vitest";
// This public navigation rule keeps movement within the explorable habitat.
import { keepVisitorInsideGarden } from "./garden-navigation";

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
    { x: 18, z: -24 },
    { x: -18, z: 13 },
  ]);
});

// Protect the physical promise that a visitor cannot walk through a tree trunk.
test("walking into a tree stops outside its trunk", () => {
  // Place the visitor inside the threshold oak's visible trunk footprint.
  const attemptedPosition = { x: -14.2, z: 7 };
  // Apply the exact navigation rule called after every live camera movement.
  keepVisitorInsideGarden(attemptedPosition);
  // Measure the visitor's resolved horizontal distance from the tree centre.
  const distanceFromTree = Math.hypot(
    attemptedPosition.x - -14,
    attemptedPosition.z - 7,
  );
  // The camera body and trunk together need roughly this much clear space.
  expect(distanceFromTree).toBeGreaterThanOrEqual(0.8);
});

// Protect against frame delays that could otherwise jump completely through a tree.
test("a long movement step cannot tunnel through a tree", () => {
  // Start safely west of the threshold oak's collision footprint.
  const previousPosition = { x: -15.5, z: 7 };
  // Attempt to cross the entire trunk in one unusually long animation frame.
  const attemptedPosition = { x: -12.5, z: 7 };
  // Supply both ends of the real movement segment to continuous collision handling.
  keepVisitorInsideGarden(attemptedPosition, previousPosition);
  // The visitor must remain on the approach side rather than appearing past the oak.
  expect(attemptedPosition.x).toBeLessThan(-14.8);
  // A straight approach has no sideways component, so Z should remain unchanged.
  expect(attemptedPosition.z).toBeCloseTo(7);
});

// Protect recovery when saved and attempted positions coincide at a trunk centre.
test("an exact tree-centre position recovers in a stable direction", () => {
  // Simulate a camera restored at the exact centre of the threshold oak.
  const previousPosition = { x: -14, z: 7 };
  // Keep a separate attempted object to match the live movement API.
  const attemptedPosition = { x: -14, z: 7 };
  // Resolve the otherwise directionless penetration through the navigation seam.
  keepVisitorInsideGarden(attemptedPosition, previousPosition);
  // The deterministic eastward fallback must move the visitor clear of the trunk.
  expect(attemptedPosition.x).toBeGreaterThan(-13.2);
  // Recovery should not introduce an arbitrary north-south jump.
  expect(attemptedPosition.z).toBeCloseTo(7);
});
