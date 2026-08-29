// Three measures the generated outline without rendering a WebGL scene.
import * as THREE from "three";
// Vitest protects the visual proportions that make the shape read as a leaf.
import { expect, test } from "vitest";
// The public geometry seam is shared by the test and the rendered flower leaf.
import { createFlowerLeafShape } from "./flower-leaf-shape";

// Protect the exact silhouette that previously appeared as a round green ball.
test("a flower leaf has an elongated body and narrow pointed tips", () => {
  // Sample enough points to measure the complete curved outline reliably.
  const outlinePoints = createFlowerLeafShape().getPoints(24);
  // Build the smallest rectangle enclosing all sampled outline points.
  const bounds = new THREE.Box2().setFromPoints(outlinePoints);
  // Read the visible width from the rectangle's horizontal range.
  const width = bounds.max.x - bounds.min.x;
  // Read the visible length from the rectangle's vertical range.
  const length = bounds.max.y - bounds.min.y;
  // A leaf must be noticeably longer than it is wide, unlike a ball.
  expect(length).toBeGreaterThan(width * 1.5);
  // Both ends meet on the center line to create recognisable pointed tips.
  expect(outlinePoints[0]?.x).toBeCloseTo(0);
  expect(outlinePoints.at(-1)?.x).toBeCloseTo(0);
});
