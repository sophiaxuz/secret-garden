// Three provides the reusable path consumed by the instanced leaf geometry.
import * as THREE from "three";

// Build one gently lobed English-tree leaf with a narrow stem attachment.
export function createTreeLeafShape(): THREE.Shape {
  // Begin at the base where a short leaf stalk would meet its twig.
  const leaf = new THREE.Shape();
  leaf.moveTo(0, -0.2);
  // Small alternating lobes create a botanical edge without noisy detail.
  leaf.lineTo(-0.055, -0.12);
  leaf.lineTo(-0.12, -0.08);
  leaf.lineTo(-0.085, -0.015);
  leaf.lineTo(-0.15, 0.055);
  leaf.lineTo(-0.09, 0.095);
  leaf.lineTo(-0.12, 0.17);
  leaf.lineTo(-0.045, 0.16);
  // The pointed tip keeps the silhouette leaf-like from garden distance.
  leaf.lineTo(0, 0.27);
  // Mirror the authored lobes down the right side of the leaf.
  leaf.lineTo(0.045, 0.16);
  leaf.lineTo(0.12, 0.17);
  leaf.lineTo(0.09, 0.095);
  leaf.lineTo(0.15, 0.055);
  leaf.lineTo(0.085, -0.015);
  leaf.lineTo(0.12, -0.08);
  leaf.lineTo(0.055, -0.12);
  leaf.lineTo(0, -0.2);
  // Return the closed outline shared by every canopy instance.
  return leaf;
}
