// Three measures the production petal geometry without mounting a WebGL canvas.
import * as THREE from "three";
// Vitest protects the botanical proportions visitors perceive at walking height.
import { expect, test } from "vitest";
// The public factory is the same seam consumed by every rendered ordinary bloom.
import { createFlowerPetalGeometry } from "./flower-petal-shape";

// A believable petal needs real curvature and a tapered radial silhouette.
test("flower petals are slender curved surfaces instead of flat cut-outs", () => {
  // Build one ordinary meadow petal using the production geometry factory.
  const geometry = createFlowerPetalGeometry();
  // Read exact local extents after the factory has generated its ribbon surface.
  geometry.computeBoundingBox();
  // A completed geometry factory always provides measurable bounds.
  const bounds = geometry.boundingBox;
  expect(bounds).not.toBeNull();
  if (!bounds) return;
  // The petal travels outward along local Z farther than its complete width.
  const width = bounds.max.x - bounds.min.x;
  const length = bounds.max.z - bounds.min.z;
  expect(length).toBeGreaterThan(width * 1.6);
  // Real vertical curvature lets grazing light describe the surface naturally.
  expect(bounds.max.y - bounds.min.y).toBeGreaterThan(0.04);
  // Several cross-sections avoid one rigid triangular or rectangular plane.
  expect(geometry.getAttribute("position").count).toBeGreaterThanOrEqual(14);
  // Varying normals prove light can roll across the petal rather than stay uniform.
  const normals = geometry.getAttribute("normal");
  const normalDirections = new Set(
    Array.from({ length: normals.count }, (_, vertex) => {
      // Rounded components keep floating-point detail from fabricating uniqueness.
      const normal = new THREE.Vector3().fromBufferAttribute(normals, vertex);
      return `${normal.x.toFixed(2)},${normal.y.toFixed(2)},${normal.z.toFixed(2)}`;
    }),
  );
  expect(normalDirections.size).toBeGreaterThan(3);
  // Release the temporary buffers after the test completes.
  geometry.dispose();
});
