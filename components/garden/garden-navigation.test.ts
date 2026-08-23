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
