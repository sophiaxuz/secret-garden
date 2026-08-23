// Three provides the indexed buffer geometry consumed by the instanced grass mesh.
import * as THREE from "three";

// Each level narrows and bends one ribbon as it rises from the soil.
const BLADE_LEVELS = [
  { height: 0, halfWidth: 0.05, bend: 0 },
  { height: 0.28, halfWidth: 0.046, bend: 0.008 },
  { height: 0.56, halfWidth: 0.036, bend: 0.028 },
  { height: 0.8, halfWidth: 0.022, bend: 0.06 },
  // A hairline width preserves the pointed look without degenerate tip triangles.
  { height: 1, halfWidth: 0.002, bend: 0.1 },
] as const;

// Three varied ribbons form one small tuft visible from every viewing direction.
const TUFT_BLADES = [
  { offsetX: -0.06, offsetZ: 0.015, rotation: 0, heightScale: 1 },
  { offsetX: 0.055, offsetZ: 0.025, rotation: 2.05, heightScale: 0.86 },
  { offsetX: 0, offsetZ: -0.055, rotation: 4.1, heightScale: 0.72 },
] as const;

// Create one reusable tuft from curved ribbon surfaces instead of a rigid cone.
export function createGrassTuftGeometry(): THREE.BufferGeometry {
  // Flat arrays are the format Three.js uploads efficiently to the GPU.
  const positions: number[] = [];
  const indices: number[] = [];

  // Give each tuft three differently oriented blades.
  TUFT_BLADES.forEach((blade) => {
    // Record where this blade's vertices begin inside the combined geometry.
    const bladeVertexStart = positions.length / 3;
    // Precalculate its horizontal direction vectors once for every level.
    const widthX = Math.cos(blade.rotation);
    const widthZ = -Math.sin(blade.rotation);
    const bendX = Math.sin(blade.rotation);
    const bendZ = Math.cos(blade.rotation);

    // Add a left and right edge vertex at every height along the blade.
    BLADE_LEVELS.forEach((level) => {
      // Curve the center increasingly toward the blade's facing direction.
      const centerX = blade.offsetX + bendX * level.bend;
      const centerZ = blade.offsetZ + bendZ * level.bend;
      // Scale height per blade so the tuft has an uneven natural outline.
      const height = level.height * blade.heightScale;
      // Store the left edge of this ribbon level.
      positions.push(
        centerX - widthX * level.halfWidth,
        height,
        centerZ - widthZ * level.halfWidth,
      );
      // Store the matching right edge of this ribbon level.
      positions.push(
        centerX + widthX * level.halfWidth,
        height,
        centerZ + widthZ * level.halfWidth,
      );
    });

    // Join each neighboring pair of levels with two surface triangles.
    for (
      let levelIndex = 0;
      levelIndex < BLADE_LEVELS.length - 1;
      levelIndex += 1
    ) {
      // Each level contributes two adjacent edge vertices.
      const lowerLeft = bladeVertexStart + levelIndex * 2;
      const lowerRight = lowerLeft + 1;
      const upperLeft = lowerLeft + 2;
      const upperRight = lowerLeft + 3;
      // These triangles create one continuous tapered ribbon segment.
      indices.push(
        lowerLeft,
        lowerRight,
        upperLeft,
        lowerRight,
        upperRight,
        upperLeft,
      );
    }
  });

  // Build the final geometry after all tuft vertices and triangles are known.
  const geometry = new THREE.BufferGeometry();
  // Position attributes give each vertex its local X, Y, and Z coordinates.
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  // The shared index avoids duplicating vertices between neighboring segments.
  geometry.setIndex(indices);
  // Smooth normals let daylight roll gently across the curved blade profiles.
  geometry.computeVertexNormals();
  // Bounding data keeps instanced frustum culling accurate.
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  // Return the complete tuft through one small testable interface.
  return geometry;
}
