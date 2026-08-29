// Three provides the curved path consumed by the flower's shared petal geometry.
import * as THREE from "three";

// Build one narrow-based petal with a softly notched organic outer edge.
export function createFlowerPetalShape(): THREE.Shape {
  // Begin at the small attachment point nearest the flower center.
  const petal = new THREE.Shape();
  petal.moveTo(0, -0.025);
  // The left curve widens gradually instead of producing an inflated oval.
  petal.bezierCurveTo(-0.09, 0.045, -0.12, 0.22, -0.035, 0.34);
  // A shallow center notch gives the outer tip a hand-shaped botanical edge.
  petal.quadraticCurveTo(0, 0.315, 0.035, 0.34);
  // The right curve returns symmetrically to the narrow attachment point.
  petal.bezierCurveTo(0.12, 0.22, 0.09, 0.045, 0, -0.025);
  // Return the closed outline for reuse across every procedural flower.
  return petal;
}
