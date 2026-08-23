// Three.js builds and shades the opaque geometry used by every cloud bank.
import * as THREE from "three";
// The official utility combines several cloud lobes into one efficient mesh.
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
// Cloud bounds keep geometry proportions aligned with the shared sky layout.
import type { CloudBounds } from "./garden-clouds";

// A neutral tuple describes local offsets and scales inside a cloud bank.
type CloudVector = [number, number, number];

// Each puff becomes one overlapping ellipsoid inside the final merged cloud.
type CloudPuff = {
  // Position uses proportions of the bank's configured width, height, and depth.
  position: CloudVector;
  // Scale uses the same proportions to form broad, softly stacked lobes.
  scale: CloudVector;
};

// Eight overlapping lobes create a recognisable cumulus silhouette without alpha.
const CLOUD_PUFFS: CloudPuff[] = [
  { position: [0, -0.08, 0], scale: [0.34, 0.68, 0.58] },
  { position: [-0.3, -0.12, 0], scale: [0.27, 0.5, 0.46] },
  { position: [0.31, -0.1, 0.03], scale: [0.26, 0.48, 0.44] },
  { position: [-0.12, 0.28, -0.02], scale: [0.25, 0.57, 0.42] },
  { position: [0.16, 0.25, 0.04], scale: [0.23, 0.52, 0.4] },
  { position: [-0.47, -0.18, -0.03], scale: [0.17, 0.35, 0.32] },
  { position: [0.47, -0.17, 0], scale: [0.17, 0.34, 0.31] },
  { position: [0, -0.2, 0.25], scale: [0.3, 0.43, 0.36] },
];

// Create one opaque, shaded cloud bank that never depends on texture alpha.
export function createCloudBankGeometry(
  bounds: CloudBounds,
  seed: number,
): THREE.BufferGeometry {
  // A modest sphere resolution keeps the silhouette round without excessive vertices.
  const sharedSphere = new THREE.SphereGeometry(1, 14, 10);
  // Odd seeds mirror their formation so the five banks do not repeat one outline.
  const horizontalDirection = seed % 2 === 0 ? 1 : -1;
  // A small deterministic height variation gives each bank its own profile.
  const heightVariation = 0.92 + (seed % 5) * 0.025;
  // One transform object is reused while producing every merged lobe.
  const transform = new THREE.Object3D();
  // Convert each normalized puff description into transformed sphere geometry.
  const puffGeometries = CLOUD_PUFFS.map((puff, index) => {
    // Scale local offsets by the complete bank dimensions.
    transform.position.set(
      puff.position[0] * bounds[0] * horizontalDirection,
      puff.position[1] * bounds[1] * heightVariation,
      puff.position[2] * bounds[2],
    );
    // Scale the unit sphere into a wide, soft cloud ellipsoid.
    transform.scale.set(
      puff.scale[0] * bounds[0],
      puff.scale[1] * bounds[1] * heightVariation,
      puff.scale[2] * bounds[2],
    );
    // Slightly turn each lobe so highlights do not form mechanical rows.
    transform.rotation.set(0, seed * 0.07 + index * 0.11, index * 0.025);
    // Compose position, rotation, and scale into one reusable matrix.
    transform.updateMatrix();
    // Clone before applying the matrix so the shared unit sphere remains unchanged.
    return sharedSphere.clone().applyMatrix4(transform.matrix);
  });
  // Merge all lobes so each complete cloud bank remains one mesh and draw call.
  const geometry = mergeGeometries(puffGeometries, false);
  // Temporary lobe buffers are no longer needed after the merge copies their data.
  puffGeometries.forEach((puffGeometry) => puffGeometry.dispose());
  // Release the unit sphere template for the same reason.
  sharedSphere.dispose();
  // A null result would mean the lobe attributes became incompatible.
  if (!geometry) throw new Error("Cloud puff geometry could not be merged.");
  // Bounding data supplies both efficient rendering and a vertical shading range.
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  // The merge always contains positions, but guard to keep the failure explicit.
  if (!geometry.boundingBox) throw new Error("Cloud geometry has no bounds.");
  // Read the final vertices before assigning their soft top-to-bottom tones.
  const positions = geometry.getAttribute("position");
  // Cache the vertical span so every vertex uses the same normalization.
  const minimumY = geometry.boundingBox.min.y;
  const height = geometry.boundingBox.max.y - minimumY;
  // Store one RGB triplet for every merged vertex.
  const colors = new Float32Array(positions.count * 3);
  // Darker undersides remain visible even against the garden's pale daytime sky.
  for (let vertexIndex = 0; vertexIndex < positions.count; vertexIndex += 1) {
    // Convert this vertex's height into a zero-to-one progress value.
    const heightProgress = (positions.getY(vertexIndex) - minimumY) / height;
    // Blend from a soft grey underside to a warm white crown.
    const shade = 0.62 + heightProgress * 0.38;
    // Write a subtly warm neutral that the phase material can tint later.
    colors[vertexIndex * 3] = shade;
    colors[vertexIndex * 3 + 1] = shade * 0.98;
    colors[vertexIndex * 3 + 2] = shade * 0.92;
  }
  // Attach the tonal gradient for the material's vertexColors setting.
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  // Return substantial opaque geometry through one small testable interface.
  return geometry;
}
