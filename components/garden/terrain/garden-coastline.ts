// Three creates the irregular two-dimensional shape triangulated by the terrain mesh.
import * as THREE from "three";

// Each shoreline point stores world X and Z around the complete garden island.
export type ShorelinePoint = readonly [x: number, z: number];

// Hand-shaped asymmetry avoids the unmistakable silhouette of a rectangle or circle.
export const GARDEN_SHORELINE: readonly ShorelinePoint[] = [
  [-24, 16],
  [-12, 19],
  [3, 18.5],
  [17, 17],
  [24, 11],
  [25.5, 0],
  [24, -13],
  [20, -27],
  [8, -31],
  [-6, -31.5],
  [-19, -28],
  [-24.5, -19],
  [-26, -5],
  [-25.5, 8],
] as const;

// Convert world X/Z points into ShapeGeometry's local X/Y drawing plane.
export function createGardenIslandShape(): THREE.Shape {
  // One shape becomes the shared outline used by meadow and sandy shore meshes.
  const shape = new THREE.Shape();
  // Shape local Y becomes negative world Z after the mesh rotates onto the ground.
  const [firstX, firstZ] = GARDEN_SHORELINE[0];
  // Begin at the first coastal point before drawing every remaining edge.
  shape.moveTo(firstX, -firstZ);
  // Connect the points in order to preserve the intentionally irregular silhouette.
  for (const [x, z] of GARDEN_SHORELINE.slice(1)) shape.lineTo(x, -z);
  // Close the final gap so Three can triangulate one solid island surface.
  shape.closePath();
  // Return the completed reusable shoreline drawing.
  return shape;
}

// Test whether one world-space point lies inside the authored coastal polygon.
export function isInsideGardenShoreline(point: ShorelinePoint): boolean {
  // Ray crossing toggles this value whenever a horizontal ray meets an edge.
  let inside = false;
  // Visit each edge using the current and previous polygon vertices.
  for (
    let current = 0, previous = GARDEN_SHORELINE.length - 1;
    current < GARDEN_SHORELINE.length;
    previous = current, current += 1
  ) {
    // Read both ends of the current shoreline edge in world coordinates.
    const [currentX, currentZ] = GARDEN_SHORELINE[current];
    const [previousX, previousZ] = GARDEN_SHORELINE[previous];
    // Only edges straddling the test point's Z can cross its horizontal ray.
    const straddles = currentZ > point[1] !== previousZ > point[1];
    // Calculate the X coordinate where that edge meets the test point's Z.
    const intersectionX =
      ((previousX - currentX) * (point[1] - currentZ)) /
        (previousZ - currentZ) +
      currentX;
    // Toggle parity when the crossing lies to the right of the tested point.
    if (straddles && point[0] < intersectionX) inside = !inside;
  }
  // Odd crossing parity means the point is enclosed by the coast.
  return inside;
}
