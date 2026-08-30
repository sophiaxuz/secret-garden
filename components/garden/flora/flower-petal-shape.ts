// Three provides the curved path consumed by the flower's shared petal geometry.
import * as THREE from "three";
// One archetype catalogue owns petal proportions together with bloom materials.
import {
  FLOWER_ARCHETYPE_STYLES,
  type FlowerPetalProfile,
} from "./flower/flower-archetype";

// Re-exporting preserves the small geometry module's established public contract.
export type { FlowerPetalProfile } from "./flower/flower-archetype";

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

// Each cross-section stores distance, half-width, and height above the flower disc.
const PETAL_SECTIONS = [
  { distance: 0, halfWidth: 0.012, lift: 0 },
  { distance: 0.022, halfWidth: 0.028, lift: 0.005 },
  { distance: 0.048, halfWidth: 0.045, lift: 0.014 },
  { distance: 0.078, halfWidth: 0.06, lift: 0.026 },
  { distance: 0.11, halfWidth: 0.069, lift: 0.036 },
  { distance: 0.142, halfWidth: 0.071, lift: 0.043 },
  { distance: 0.172, halfWidth: 0.065, lift: 0.046 },
  { distance: 0.198, halfWidth: 0.054, lift: 0.044 },
  { distance: 0.22, halfWidth: 0.038, lift: 0.038 },
  { distance: 0.237, halfWidth: 0.023, lift: 0.03 },
  { distance: 0.245, halfWidth: 0.01, lift: 0.02 },
] as const;

// Five width samples create a raised midrib and softly curled petal margins.
const PETAL_WIDTH_SAMPLES = [-1, -0.5, 0, 0.5, 1] as const;

// Create one tapered, curved petal that extends radially along local positive Z.
export function createFlowerPetalGeometry(
  profile: FlowerPetalProfile = "meadow",
): THREE.BufferGeometry {
  // Resolve the selected species proportions once before building cross-sections.
  const style = FLOWER_ARCHETYPE_STYLES[profile].petal;
  // Flat arrays are the efficient upload format expected by Three.js buffers.
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  // Add five curved width samples at every point along the petal length.
  PETAL_SECTIONS.forEach((section, sectionIndex) => {
    // Progress drives edge ruffling without changing the narrow attachment point.
    const progress = sectionIndex / (PETAL_SECTIONS.length - 1);
    // Alternating side offsets make outer edges subtly hand-grown, never mirrored.
    const ruffle =
      Math.sin(progress * Math.PI * 2.4) * style.ruffle * progress * 0.018;
    // Profile width distinguishes ray, bowl, and broad-petalled flower families.
    const halfWidth = section.halfWidth * style.width;
    // Species length keeps centers proportional while sharing one authored topology.
    const distance = section.distance * style.length;
    // A sine arch supplements the hand-authored lift for convincing cup curvature.
    const height =
      section.lift * style.cup +
      Math.sin(progress * Math.PI) * style.cup * 0.012;
    // Every cross-section gains a central ridge, rolled edges, and pigment vein.
    PETAL_WIDTH_SAMPLES.forEach((widthSample) => {
      // The center of notched species ends slightly behind its two outer lobes.
      const tipNotch =
        Math.pow(progress, 9) *
        style.notch *
        (1 - Math.abs(widthSample)) *
        0.055;
      // A subtle midrib rises while outer margins curl independently.
      const ridge =
        (1 - Math.abs(widthSample)) * 0.012 * Math.sin(progress * Math.PI);
      const edgeCurl = Math.pow(Math.abs(widthSample), 2) * ruffle * -0.65;
      // Width sample moves from the left edge through the midrib to the right edge.
      positions.push(
        halfWidth * widthSample,
        height + ridge + edgeCurl,
        distance - tipNotch,
      );
      // Darker attachment and midrib pigment suggest fine natural venation.
      const baseShade = 0.76 + progress * 0.24;
      const veinShade = 1 - (1 - Math.abs(widthSample)) * 0.055;
      colors.push(
        baseShade * veinShade,
        baseShade * 0.98 * veinShade,
        baseShade * 0.95 * veinShade,
      );
    });
  });

  // Join neighboring cross-sections and width bands into one continuous surface.
  for (let section = 0; section < PETAL_SECTIONS.length - 1; section += 1) {
    // Four bands bridge the five samples across this pair of length sections.
    for (let band = 0; band < PETAL_WIDTH_SAMPLES.length - 1; band += 1) {
      // Resolve the four corners of this small curved surface cell.
      const lowerLeft = section * PETAL_WIDTH_SAMPLES.length + band;
      const lowerRight = lowerLeft + 1;
      const upperLeft = lowerLeft + PETAL_WIDTH_SAMPLES.length;
      const upperRight = upperLeft + 1;
      // Consistent winding creates smooth normals across shared interior edges.
      indices.push(
        lowerLeft,
        upperLeft,
        lowerRight,
        lowerRight,
        upperLeft,
        upperRight,
      );
    }
  }

  // Assemble the reusable indexed geometry after every section is known.
  const geometry = new THREE.BufferGeometry();
  // Position supplies width, height, and radial distance for each surface point.
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  // Vertex pigment gives each flower a subtle natural root-to-tip tonal shift.
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  // Shared indices keep normals smooth where neighboring sections meet.
  geometry.setIndex(indices);
  // Curved normals let daylight roll across the petal instead of lighting it flatly.
  geometry.computeVertexNormals();
  // Bounds preserve accurate culling for each complete instanced flower head.
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  // Return one production-ready petal surface owned by its flower component.
  return geometry;
}
