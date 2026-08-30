// Three creates and updates the buffer geometry rendered by the meadow material.
import * as THREE from "three";
// Tessellation supplies enough real vertices for smooth walking-scale undulation.
import { TessellateModifier } from "three/examples/jsm/modifiers/TessellateModifier.js";
// Merging shared positions lets recomputed normals flow smoothly between triangles.
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
// A simple tuple keeps extracted shape points independent from renderer vectors.
type GroundBoundaryPoint = readonly [x: number, z: number];

// Find the shortest planar distance from one point to a finite line segment.
function distanceToSegment(
  pointX: number,
  pointZ: number,
  start: readonly [number, number],
  end: readonly [number, number],
): number {
  // Build the complete segment direction in the garden's horizontal plane.
  const edgeX = end[0] - start[0];
  const edgeZ = end[1] - start[1];
  // Squared length avoids an unnecessary root while calculating projection.
  const edgeLengthSquared = edgeX * edgeX + edgeZ * edgeZ;
  // Shape extraction may repeat its closing point, producing one zero-length edge.
  if (edgeLengthSquared === 0) {
    // A collapsed segment behaves exactly like distance to its single endpoint.
    return Math.hypot(pointX - start[0], pointZ - start[1]);
  }
  // Clamp projection so distance is measured to the finite edge, not its line.
  const projection = THREE.MathUtils.clamp(
    ((pointX - start[0]) * edgeX + (pointZ - start[1]) * edgeZ) /
      edgeLengthSquared,
    0,
    1,
  );
  // Reconstruct the nearest location along the segment.
  const nearestX = start[0] + edgeX * projection;
  const nearestZ = start[1] + edgeZ * projection;
  // Return physical world-space distance from the point to that location.
  return Math.hypot(pointX - nearestX, pointZ - nearestZ);
}

// Find distance to the closest segment around the complete irregular island coast.
function distanceToShoreline(
  pointX: number,
  pointZ: number,
  boundary: readonly GroundBoundaryPoint[],
): number {
  // Begin above any possible island distance so every real edge replaces it.
  let closestDistance = Number.POSITIVE_INFINITY;
  // Compare the point with each edge, including the closing final-to-first edge.
  boundary.forEach((start, index) => {
    // Wrapping reconnects the final shoreline coordinate to the first.
    const end = boundary[(index + 1) % boundary.length];
    // Retain only the smallest physical distance found so far.
    closestDistance = Math.min(
      closestDistance,
      distanceToSegment(pointX, pointZ, start, end),
    );
  });
  // The result drives a soft zero-height boundary around the complete island.
  return closestDistance;
}

// Produce calm layered relief without introducing random runtime movement.
function getMeadowHeight(worldX: number, worldZ: number): number {
  // Long shallow swells stop the island reading as a mathematically perfect plane.
  const broadRelief =
    Math.sin(worldX * 0.17 + worldZ * 0.065) * 0.012 +
    Math.sin(worldZ * 0.21 - worldX * 0.045 + 1.7) * 0.009;
  // Crossing smaller waves break the broad forms into irregular natural hummocks.
  const middleRelief =
    Math.sin(worldX * 0.43 + worldZ * 0.31 - 0.8) * 0.005 +
    Math.cos(worldZ * 0.52 - worldX * 0.27 + 2.2) * 0.0035;
  // A restrained high-frequency note keeps silhouettes organic beside the camera.
  const fineRelief =
    Math.sin(worldX * 0.91 + Math.sin(worldZ * 0.37) * 1.4) * 0.002;
  // Combine frequencies into an intentionally subtle walkable height field.
  return broadRelief + middleRelief + fineRelief;
}

// Create a truly three-dimensional island floor from the shared coast shape.
export function createMeadowGroundGeometry(
  shape: THREE.Shape,
): THREE.BufferGeometry {
  // Extract the caller's actual outline so shape and shoreline taper cannot diverge.
  const boundary = shape
    .extractPoints(8)
    .shape.map(({ x, y }) => [x, -y] as const);
  // Begin with the exact same triangulated outline used by sand and navigation.
  const coastlineGeometry = new THREE.ShapeGeometry(shape, 8);
  // Split long faces until broad triangles cannot reveal the procedural height field.
  const tessellator = new TessellateModifier(1.15, 9);
  // Tessellation retains UVs while producing a dense non-indexed working surface.
  const tessellatedGeometry = tessellator.modify(coastlineGeometry);
  // The original sparse geometry is no longer needed after subdivision completes.
  coastlineGeometry.dispose();
  // Merge coincident corners so final normals can flow gently across triangle edges.
  const geometry = mergeVertices(tessellatedGeometry, 0.00001);
  // Release the temporary unmerged arrays after the optimized copy is complete.
  tessellatedGeometry.dispose();
  // Position is mutable because local Z becomes the meadow's final world height.
  const positions = geometry.getAttribute("position") as THREE.BufferAttribute;

  // Displace each subdivided point while tapering every coast vertex back to zero.
  for (let vertex = 0; vertex < positions.count; vertex += 1) {
    // Shape local X already matches the garden's world horizontal X axis.
    const worldX = positions.getX(vertex);
    // Shape local Y becomes negative world Z after the component rotates it flat.
    const worldZ = -positions.getY(vertex);
    // Relief fades over two metres so no vertical lip rises above the sandy shore.
    const shoreFade = THREE.MathUtils.smoothstep(
      distanceToShoreline(worldX, worldZ, boundary),
      0,
      2,
    );
    // Local Z rotates into world Y, producing true geometry rather than bump shading.
    positions.setZ(vertex, getMeadowHeight(worldX, worldZ) * shoreFade);
  }
  // Upload the changed positions before normals and bounds are calculated.
  positions.needsUpdate = true;
  // Smooth normals let sunlight and moonlight describe the quiet hummock shapes.
  geometry.computeVertexNormals();
  // Accurate bounds preserve frustum culling after vertical displacement.
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  // Return one reusable surface owned and disposed by MeadowGround.
  return geometry;
}
