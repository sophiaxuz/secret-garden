// Three provides the curved two-dimensional path used by ShapeGeometry.
import * as THREE from "three";

// Build one pointed botanical outline instead of using a round primitive.
export function createFlowerLeafShape(): THREE.Shape {
  // Create an empty path that will be closed around the leaf edge.
  const leaf = new THREE.Shape();
  // Begin at the narrow point where the leaf meets its stem.
  leaf.moveTo(0, -0.28);
  // Curve up the left edge toward the leaf's pointed outer tip.
  leaf.bezierCurveTo(-0.17, -0.12, -0.18, 0.14, 0, 0.3);
  // Curve back down the right edge to close the organic almond shape.
  leaf.bezierCurveTo(0.18, 0.14, 0.17, -0.12, 0, -0.28);
  // Return the reusable outline consumed by the rendered leaf component.
  return leaf;
}
