// Three provides the indexed buffer geometry consumed by the instanced grass mesh.
import * as THREE from "three";

// Each level narrows, bends, and lightens one ribbon as it rises from the soil.
const BLADE_LEVELS = [
  { height: 0, widthScale: 1, bendProgress: 0, shade: 0.54 },
  { height: 0.18, widthScale: 0.96, bendProgress: 0.04, shade: 0.62 },
  { height: 0.38, widthScale: 0.82, bendProgress: 0.16, shade: 0.71 },
  { height: 0.6, widthScale: 0.6, bendProgress: 0.38, shade: 0.8 },
  { height: 0.81, widthScale: 0.32, bendProgress: 0.68, shade: 0.89 },
  // A tiny final width keeps the tip graceful without collapsing its triangle.
  { height: 1, widthScale: 0.06, bendProgress: 1, shade: 0.96 },
] as const;

// Seven fine blades overlap into a loose tuft without forming a rigid star shape.
const TUFT_BLADES = [
  {
    offsetX: -0.045,
    offsetZ: 0.012,
    rotation: 0.2,
    heightScale: 1,
    halfWidth: 0.017,
    bend: 0.12,
    sideCurve: 0.008,
    tone: 1,
  },
  {
    offsetX: 0.035,
    offsetZ: 0.028,
    rotation: 1.08,
    heightScale: 0.79,
    halfWidth: 0.014,
    bend: 0.085,
    sideCurve: -0.006,
    tone: 0.94,
  },
  {
    offsetX: 0.022,
    offsetZ: -0.042,
    rotation: 2.04,
    heightScale: 0.91,
    halfWidth: 0.016,
    bend: 0.135,
    sideCurve: 0.01,
    tone: 0.98,
  },
  {
    offsetX: -0.038,
    offsetZ: -0.036,
    rotation: 2.96,
    heightScale: 0.66,
    halfWidth: 0.013,
    bend: 0.07,
    sideCurve: -0.007,
    tone: 0.9,
  },
  {
    offsetX: 0.062,
    offsetZ: -0.008,
    rotation: 3.92,
    heightScale: 0.84,
    halfWidth: 0.015,
    bend: 0.105,
    sideCurve: 0.006,
    tone: 0.96,
  },
  {
    offsetX: -0.065,
    offsetZ: 0.046,
    rotation: 4.88,
    heightScale: 0.57,
    halfWidth: 0.012,
    bend: 0.06,
    sideCurve: -0.005,
    tone: 0.88,
  },
  {
    offsetX: 0.004,
    offsetZ: 0.06,
    rotation: 5.72,
    heightScale: 0.73,
    halfWidth: 0.0135,
    bend: 0.08,
    sideCurve: 0.007,
    tone: 0.92,
  },
] as const;

// Create one reusable tuft from curved ribbon surfaces instead of a rigid cone.
export function createGrassTuftGeometry(): THREE.BufferGeometry {
  // Flat arrays are the format Three.js uploads efficiently to the GPU.
  const positions: number[] = [];
  const indices: number[] = [];
  // Neutral vertex shades multiply with each tuft's natural green instance color.
  const colors: number[] = [];

  // Give each tuft seven differently oriented and proportioned blades.
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
      // A small sideways arc prevents the ribbons from looking mechanically bent.
      const lateralCurve = blade.sideCurve * Math.sin(level.height * Math.PI);
      // Curve the center increasingly toward the blade's individual direction.
      const centerX =
        blade.offsetX +
        bendX * blade.bend * level.bendProgress +
        widthX * lateralCurve;
      const centerZ =
        blade.offsetZ +
        bendZ * blade.bend * level.bendProgress +
        widthZ * lateralCurve;
      // Scale height per blade so the tuft has an uneven natural outline.
      const height = level.height * blade.heightScale;
      // Fine base widths keep every ribbon grass-like rather than leaf-like.
      const halfWidth = blade.halfWidth * level.widthScale;
      // Store the left edge of this ribbon level.
      positions.push(
        centerX - widthX * halfWidth,
        height,
        centerZ - widthZ * halfWidth,
      );
      // Store the matching right edge of this ribbon level.
      positions.push(
        centerX + widthX * halfWidth,
        height,
        centerZ + widthZ * halfWidth,
      );
      // Darker roots and softly brighter tips add depth without extra materials.
      const shade = level.shade * blade.tone;
      // A subtly warm neutral preserves variation after multiplication by green.
      colors.push(shade * 0.93, shade, shade * 0.88);
      // Both edge vertices share the same gradient colour across the ribbon width.
      colors.push(shade * 0.93, shade, shade * 0.88);
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
  // Per-vertex shades produce soft depth while retaining per-instance greens.
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
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
