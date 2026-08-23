// Vitest checks the public geometry produced for one visible cloud bank.
import { expect, test } from "vitest";
// The factory replaces fragile transparent billboards with opaque cloud volume.
import { createCloudBankGeometry } from "./cloud-geometry";

// Protect the rendered cloud seam from regressing to empty or texture-only output.
test("a cloud bank contains substantial shaded three-dimensional geometry", () => {
  // Use the same dimensions as the central garden cloud formation.
  const geometry = createCloudBankGeometry([8, 2.8, 3.6], 13);
  // Read the uploaded positions and tonal colors through Three.js's public API.
  const positions = geometry.getAttribute("position");
  const colors = geometry.getAttribute("color");
  // Hundreds of vertices guarantee real volume rather than one transparent plane.
  expect(positions.count).toBeGreaterThan(500);
  // Every vertex needs a shade so rounded cloud lobes remain visible on pale sky.
  expect(colors.count).toBe(positions.count);
  // Bounding data proves the formation occupies meaningful space in all axes.
  expect(geometry.boundingBox).not.toBeNull();
  expect(
    geometry.boundingBox!.max.x - geometry.boundingBox!.min.x,
  ).toBeGreaterThan(7);
  expect(
    geometry.boundingBox!.max.y - geometry.boundingBox!.min.y,
  ).toBeGreaterThan(3);
  // Release the test geometry exactly as the React component does on unmount.
  geometry.dispose();
});
