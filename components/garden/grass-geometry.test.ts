// Vitest supplies the geometry assertions and test function.
import { expect, test } from "vitest";
// This public factory creates the shared shape rendered by every grass instance.
import { createGrassTuftGeometry } from "./grass-geometry";
// Three's vectors make triangle-area and normal-length checks easy to read.
import * as THREE from "three";

// Protect the fine, layered meadow silhouette that replaced the chunky first draft.
test("grass geometry forms a slender layered meadow tuft", () => {
  // Build the same reusable geometry that Grass mounts into its instanced mesh.
  const geometry = createGrassTuftGeometry();
  // Calculate exact local extents from the generated blade vertices.
  geometry.computeBoundingBox();
  // Read the bounds after guarding the nullable Three.js property explicitly.
  const bounds = geometry.boundingBox;
  // A completed geometry factory must always produce measurable bounds.
  expect(bounds).not.toBeNull();
  if (!bounds) return;
  // Custom ribbon geometry avoids the rigid radial silhouette of ConeGeometry.
  expect(geometry.type).toBe("BufferGeometry");
  // The tuft begins at ground level instead of straddling the floor plane.
  expect(bounds.min.y).toBeCloseTo(0);
  // A normalized height lets instance transforms control all field variation.
  expect(bounds.max.y).toBeCloseTo(1);
  // Several offset blades give the tuft visible width from the front.
  expect(bounds.max.x - bounds.min.x).toBeGreaterThan(0.15);
  // Differently oriented blades keep the tuft visible from the side as well.
  expect(bounds.max.z - bounds.min.z).toBeGreaterThan(0.15);
  // Many slim segmented ribbons overlap into a soft tuft instead of three broad fins.
  expect(geometry.getAttribute("position").count).toBeGreaterThanOrEqual(70);
  // A subtle per-vertex gradient gives the base and tips natural tonal variation.
  const colors = geometry.getAttribute("color");
  // Every rendered vertex needs a matching colour so the gradient stays continuous.
  expect(colors.count).toBe(geometry.getAttribute("position").count);
  // Collect green-channel shades to verify that the tuft is not one flat colour.
  const greenShades = Array.from({ length: colors.count }, (_, vertex) =>
    colors.getY(vertex),
  );
  // Dark roots and brighter tips should create a clearly visible tonal range.
  expect(Math.max(...greenShades) - Math.min(...greenShades)).toBeGreaterThan(
    0.3,
  );
  // Read the indexed triangles and vertex positions used by the renderer.
  const index = geometry.getIndex();
  const positions = geometry.getAttribute("position");
  // The tuft is deliberately indexed so adjacent ribbon segments share vertices.
  expect(index).not.toBeNull();
  if (!index) return;
  // Reuse vectors while checking that every emitted triangle has visible area.
  const pointA = new THREE.Vector3();
  const pointB = new THREE.Vector3();
  const pointC = new THREE.Vector3();
  const edgeAB = new THREE.Vector3();
  const edgeAC = new THREE.Vector3();
  // Walk through the index in groups of three because each group is a triangle.
  for (let offset = 0; offset < index.count; offset += 3) {
    // Load this triangle's three vertex positions from the shared position buffer.
    pointA.fromBufferAttribute(positions, index.getX(offset));
    pointB.fromBufferAttribute(positions, index.getX(offset + 1));
    pointC.fromBufferAttribute(positions, index.getX(offset + 2));
    // A nonzero cross product proves the triangle did not collapse into a line.
    edgeAB.subVectors(pointB, pointA);
    edgeAC.subVectors(pointC, pointA);
    expect(edgeAB.cross(edgeAC).lengthSq()).toBeGreaterThan(0);
  }
  // Every vertex needs a usable normal so garden lighting reaches blade tips.
  const normals = geometry.getAttribute("normal");
  // Check all components are finite before checking each vector's length.
  for (let vertex = 0; vertex < normals.count; vertex += 1) {
    const normal = new THREE.Vector3().fromBufferAttribute(normals, vertex);
    expect(Number.isFinite(normal.x)).toBe(true);
    expect(Number.isFinite(normal.y)).toBe(true);
    expect(Number.isFinite(normal.z)).toBe(true);
    expect(normal.lengthSq()).toBeGreaterThan(0);
  }
  // Release the test geometry just as Three.js would during scene disposal.
  geometry.dispose();
});
