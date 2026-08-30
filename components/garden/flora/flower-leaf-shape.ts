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

// Turn the tested two-dimensional outline into a gently folded living leaf surface.
export function createFlowerLeafGeometry(): THREE.BufferGeometry {
  // ShapeGeometry preserves the established pointed silhouette and smooth edges.
  const geometry = new THREE.ShapeGeometry(createFlowerLeafShape(), 12);
  // Position vertices can be lifted before normals describe the final curved blade.
  const positions = geometry.getAttribute("position") as THREE.BufferAttribute;

  // Give the blade a central crown and softly lower both outer margins.
  for (let vertex = 0; vertex < positions.count; vertex += 1) {
    // Width progress reaches one at either edge of the tested leaf outline.
    const widthProgress = Math.min(1, Math.abs(positions.getX(vertex)) / 0.18);
    // Length progress keeps both pointed ends close to their stem-facing plane.
    const lengthProgress = Math.min(1, Math.abs(positions.getY(vertex)) / 0.3);
    // A raised midrib and lowered margins create a shallow botanical fold.
    const fold =
      (1 - lengthProgress) * 0.024 - Math.pow(widthProgress, 1.6) * 0.016;
    // Local Z becomes visible leaf depth after each component rotation.
    positions.setZ(vertex, fold);
  }
  // Upload the folded surface before recalculating its light-facing directions.
  positions.needsUpdate = true;
  // Curved normals let soft daylight travel across the leaf blade.
  geometry.computeVertexNormals();
  // Bounds keep the shared geometry safe for ordinary view-frustum culling.
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  // Return one immutable surface reused by every flower leaf.
  return geometry;
}
