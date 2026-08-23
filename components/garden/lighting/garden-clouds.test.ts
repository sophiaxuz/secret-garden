// Vitest supplies the behavioral assertions for the cloud-drift seam.
import { expect, test } from "vitest";
// Three.js projects the real cloud coordinates through the real entrance camera.
import { PerspectiveCamera, Vector3 } from "three";
// Shared layout supplies the same camera position used by the garden Canvas.
import { GARDEN_LAYOUT } from "../garden-layout";
// The public drift helper keeps moving cloud banks inside the garden sky.
import { advanceCloudPosition, CLOUD_BANKS } from "./garden-clouds";

// Protect both ordinary movement and the invisible wrap beyond the horizon.
test("cloud banks drift continuously across the whole garden sky", () => {
  // A cloud in open sky advances by the exact wind distance.
  expect(advanceCloudPosition(0, 1.5)).toBe(1.5);
  // Crossing the hidden eastern boundary preserves overshoot beyond the west fog.
  expect(advanceCloudPosition(109, 3)).toBe(-108);
});

// Protect the entrance experience so clouds appear without requiring visitors to look up.
test("multiple cloud banks are clearly visible from the garden entrance", () => {
  // Match the Canvas camera and a common landscape browser viewport.
  const camera = new PerspectiveCamera(62, 755 / 483, 0.1, 1_000);
  // Begin at the same human-height entrance coordinates as the real visitor.
  camera.position.set(
    GARDEN_LAYOUT.entrance.x,
    GARDEN_LAYOUT.entrance.y,
    GARDEN_LAYOUT.entrance.z,
  );
  // The untouched first-person camera initially faces down the negative z axis.
  camera.lookAt(
    GARDEN_LAYOUT.entrance.x,
    GARDEN_LAYOUT.entrance.y,
    GARDEN_LAYOUT.entrance.z - 10,
  );
  // Projection requires the camera's world transform to be current.
  camera.updateMatrixWorld();
  // Project every bank center into normalized screen coordinates.
  const clearlyVisibleBanks = CLOUD_BANKS.filter((bank) => {
    // Clone the configuration into a mutable vector before projection.
    const screenPosition = new Vector3(...bank.position).project(camera);
    // Keep one formation inside the central width and below the extreme top strip.
    return (
      Math.abs(screenPosition.x) <= 0.7 &&
      screenPosition.y >= -0.2 &&
      screenPosition.y <= 0.65 &&
      screenPosition.z <= 1
    );
  });
  // More than one bank makes the effect unmistakable rather than a lucky edge case.
  expect(clearlyVisibleBanks.length).toBeGreaterThanOrEqual(2);
});
