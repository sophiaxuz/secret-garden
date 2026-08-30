// Vitest and Three protect the ground's true three-dimensional surface behavior.
import { expect, test } from "vitest";
// The authored island shape provides the same coastline rendered in production.
import { createGardenIslandShape } from "../garden-coastline";
// This public factory creates the detailed meadow surface beneath the material.
import { createMeadowGroundGeometry } from "./meadow-ground-geometry";

// A natural island floor needs real undulation while meeting its shoreline cleanly.
test("meadow geometry has smooth relief that settles at the coast", () => {
  // Build the production geometry through its renderer-independent public seam.
  const geometry = createMeadowGroundGeometry(createGardenIslandShape());
  // Read exact local bounds after the factory has completed displacement.
  geometry.computeBoundingBox();
  // A finished terrain surface always exposes measurable extents.
  const bounds = geometry.boundingBox;
  expect(bounds).not.toBeNull();
  if (!bounds) return;
  // Thousands of vertices prevent broad triangular facets at walking height.
  expect(geometry.getAttribute("position").count).toBeGreaterThan(2000);
  // Local Z becomes world height after the meadow rotates flat in the scene.
  expect(bounds.max.z - bounds.min.z).toBeGreaterThan(0.025);
  // The first authored shoreline point must remain level with the sandy coast.
  const positions = geometry.getAttribute("position");
  let closestDistance = Number.POSITIVE_INFINITY;
  let coastalHeight = Number.POSITIVE_INFINITY;
  // Locate the subdivided vertex nearest local coordinates (-24, -16).
  for (let vertex = 0; vertex < positions.count; vertex += 1) {
    // Shape-local Y is the negative of the corresponding world Z coordinate.
    const distance = Math.hypot(
      positions.getX(vertex) + 24,
      positions.getY(vertex) + 16,
    );
    // Retain the closest point and its displaced local height.
    if (distance < closestDistance) {
      closestDistance = distance;
      coastalHeight = positions.getZ(vertex);
    }
  }
  // Boundary taper avoids a raised vertical lip above the beach.
  expect(closestDistance).toBeLessThan(0.01);
  expect(coastalHeight).toBeCloseTo(0);
  // Recomputed normals prove lighting follows relief rather than one flat plane.
  const normals = geometry.getAttribute("normal");
  const tiltedNormals = Array.from({ length: normals.count }, (_, vertex) =>
    Math.hypot(normals.getX(vertex), normals.getY(vertex)),
  );
  expect(Math.max(...tiltedNormals)).toBeGreaterThan(0.015);
  // Release GPU-facing arrays after the test just as the component does on unmount.
  geometry.dispose();
});
