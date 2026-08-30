// React installs the authored transform of every leaf into one instanced mesh.
import { useLayoutEffect, useMemo, useRef } from "react";
// Three creates botanical surfaces and combines their local transforms efficiently.
import * as THREE from "three";
// The ordinary folded blade remains the honest fallback for unknown memory flowers.
import { createFlowerLeafGeometry } from "../flower-leaf-shape";
// Foliage names come from the species-level whole-plant catalogue.
import type { FlowerFoliage as FlowerFoliageKind } from "./flower-plant-structure";

// One leaf placement holds the transform later uploaded to the GPU instance buffer.
type LeafPlacement = {
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  scale: readonly [number, number, number];
};

// Fold a flat leaf along its midrib so daylight can reveal a living surface.
function foldLeafGeometry(
  geometry: THREE.BufferGeometry,
): THREE.BufferGeometry {
  // Position is mutable while the one shared geometry is being authored.
  const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
  // Lift the center and curl the edges through every vertex.
  for (let vertex = 0; vertex < positions.count; vertex += 1) {
    // The broadest supported foliage shape reaches roughly 0.2 local units.
    const width = Math.min(1, Math.abs(positions.getX(vertex)) / 0.2);
    // A soft ridge is stronger near the middle than at either margin.
    positions.setZ(vertex, (1 - width) * 0.018 - width * 0.009);
  }
  // Tell Three that the vertex buffer and its derived light directions changed.
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  // Return the same now-curved geometry for module-level sharing.
  return geometry;
}

// Build a toothed lancet leaf for daisies and each dog-rose leaflet.
function createSerratedLeafGeometry(): THREE.BufferGeometry {
  // Alternating edge points suggest fine teeth without a photographic texture.
  const outline = new THREE.Shape();
  outline.moveTo(0, -0.25);
  outline.lineTo(-0.055, -0.16);
  outline.lineTo(-0.085, -0.12);
  outline.lineTo(-0.075, -0.08);
  outline.lineTo(-0.12, -0.025);
  outline.lineTo(-0.095, 0.015);
  outline.lineTo(-0.13, 0.08);
  outline.lineTo(-0.09, 0.105);
  outline.lineTo(0, 0.27);
  outline.lineTo(0.09, 0.105);
  outline.lineTo(0.13, 0.08);
  outline.lineTo(0.095, 0.015);
  outline.lineTo(0.12, -0.025);
  outline.lineTo(0.075, -0.08);
  outline.lineTo(0.085, -0.12);
  outline.lineTo(0.055, -0.16);
  outline.closePath();
  // A folded triangulated shape stays light enough to instance repeatedly.
  return foldLeafGeometry(new THREE.ShapeGeometry(outline));
}

// Build one long woodland strap leaf that rises from the bluebell's base.
function createStrapLeafGeometry(): THREE.BufferGeometry {
  // Bezier edges taper gradually instead of ending as a rectangular blade.
  const outline = new THREE.Shape();
  outline.moveTo(0, -0.04);
  outline.bezierCurveTo(-0.055, 0.16, -0.055, 0.47, -0.012, 0.7);
  outline.quadraticCurveTo(0, 0.735, 0.012, 0.7);
  outline.bezierCurveTo(0.055, 0.47, 0.055, 0.16, 0, -0.04);
  // Folding keeps this slender blade visible as it turns toward the camera.
  return foldLeafGeometry(new THREE.ShapeGeometry(outline, 10));
}

// Build a softly divided buttercup leaf with three broad hand-shaped lobes.
function createLobedLeafGeometry(): THREE.BufferGeometry {
  // The curved outline is intentionally asymmetrical enough to avoid a badge shape.
  const outline = new THREE.Shape();
  outline.moveTo(0, -0.16);
  outline.bezierCurveTo(-0.03, -0.08, -0.15, -0.08, -0.17, 0.01);
  outline.bezierCurveTo(-0.18, 0.08, -0.1, 0.1, -0.075, 0.08);
  outline.bezierCurveTo(-0.09, 0.19, -0.025, 0.23, 0, 0.14);
  outline.bezierCurveTo(0.035, 0.23, 0.1, 0.18, 0.075, 0.08);
  outline.bezierCurveTo(0.12, 0.11, 0.185, 0.07, 0.17, 0.005);
  outline.bezierCurveTo(0.15, -0.08, 0.035, -0.08, 0, -0.16);
  // A shallow fold makes the lobes catch separate highlights.
  return foldLeafGeometry(new THREE.ShapeGeometry(outline, 12));
}

// Build a narrow divided segment used in airy cosmos foliage.
function createFeatheryLeafGeometry(): THREE.BufferGeometry {
  // Four vertices are sufficient because many overlapping segments form the leaf.
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        -0.009, -0.18, 0, 0.009, -0.18, 0, -0.004, 0.19, 0.01, 0.004, 0.19,
        0.01,
      ],
      3,
    ),
  );
  geometry.setIndex([0, 2, 1, 1, 2, 3]);
  // Normals allow the tiny leaflets to retain soft daylight shading.
  geometry.computeVertexNormals();
  return geometry;
}

// Every species reuses one immutable leaf surface rather than allocating per leaf.
const FOLIAGE_GEOMETRIES: Record<FlowerFoliageKind, THREE.BufferGeometry> = {
  "toothed-blade": createSerratedLeafGeometry(),
  "compound-serrated": createSerratedLeafGeometry(),
  "basal-straps": createStrapLeafGeometry(),
  lobed: createLobedLeafGeometry(),
  feathery: createFeatheryLeafGeometry(),
  "paired-leaves": createFlowerLeafGeometry(),
};

// Create a concise transform without hiding the botanical placement data below.
function leaf(
  position: LeafPlacement["position"],
  rotation: LeafPlacement["rotation"],
  scale: number | LeafPlacement["scale"],
): LeafPlacement {
  // A numeric scale expands equally while a tuple allows slender species forms.
  return {
    position,
    rotation,
    scale: typeof scale === "number" ? [scale, scale, scale] : scale,
  };
}

// Whole-plant leaf arrangements produce recognisable silhouettes from a distance.
const FOLIAGE_LAYOUTS: Record<FlowerFoliageKind, readonly LeafPlacement[]> = {
  "paired-leaves": [
    leaf([-0.15, 0.43, 0], [0.16, -0.34, 0.82], 0.74),
    leaf([0.13, 0.7, -0.01], [-0.12, 0.3, -0.88], 0.58),
  ],
  "toothed-blade": [
    leaf([-0.11, 0.33, 0], [0.08, -0.3, 0.75], [0.55, 0.82, 0.55]),
    leaf([0.1, 0.59, -0.01], [-0.08, 0.25, -0.82], [0.42, 0.66, 0.42]),
    leaf([-0.07, 0.78, 0.01], [0.04, -0.2, 0.65], [0.3, 0.5, 0.3]),
  ],
  "compound-serrated": [
    leaf([-0.19, 0.57, 0.01], [0.1, 0.1, 0.88], 0.34),
    leaf([-0.27, 0.66, 0.02], [0.08, 0.2, 0.45], 0.32),
    leaf([-0.1, 0.62, 0], [-0.04, -0.1, -0.72], 0.31),
    leaf([0.18, 0.73, -0.01], [-0.1, -0.15, -0.9], 0.34),
    leaf([0.27, 0.81, -0.02], [-0.08, -0.2, -0.45], 0.31),
    leaf([0.09, 0.79, 0], [0.04, 0.1, 0.72], 0.3),
    leaf([0.02, 0.38, 0.02], [0.1, 0.2, 1.05], 0.3),
  ],
  "basal-straps": [
    leaf([-0.13, 0.04, 0.02], [-0.16, 0.15, 0.36], [1, 0.82, 1]),
    leaf([0.12, 0.03, -0.04], [0.22, -0.3, -0.34], [0.92, 0.7, 0.92]),
    leaf([-0.04, 0.02, -0.1], [0.42, 0.5, 0.11], [0.8, 0.62, 0.8]),
    leaf([0.03, 0.02, 0.09], [-0.38, -0.4, -0.08], [0.72, 0.55, 0.72]),
    leaf([-0.2, 0.02, -0.05], [0.2, 0.3, 0.52], [0.72, 0.58, 0.72]),
    leaf([0.18, 0.02, 0.07], [-0.18, -0.2, -0.48], [0.68, 0.52, 0.68]),
  ],
  lobed: [
    leaf([-0.13, 0.27, 0], [0.16, -0.2, 0.74], 0.78),
    leaf([0.11, 0.43, -0.01], [-0.12, 0.3, -0.82], 0.61),
    leaf([-0.07, 0.57, 0], [0.05, -0.1, 0.6], 0.45),
  ],
  feathery: [
    ...Array.from({ length: 14 }, (_, index) => {
      // Paired narrow divisions climb the stem in an airy alternating rhythm.
      const side = index % 2 === 0 ? -1 : 1;
      const tier = Math.floor(index / 2);
      return leaf(
        [side * (0.055 + tier * 0.005), 0.25 + tier * 0.075, (tier % 2) * 0.01],
        [0.08 * (tier % 2), 0.18 * side, side * (0.72 + tier * 0.035)],
        [0.7 - tier * 0.045, 0.72, 0.7 - tier * 0.045],
      );
    }),
  ],
};

// Render all foliage belonging to one plant in a single draw call.
export function FlowerFoliage({ kind }: { kind: FlowerFoliageKind }) {
  // The catalogue selects one geometry and one authored transform collection.
  const geometry = FOLIAGE_GEOMETRIES[kind];
  const placements = FOLIAGE_LAYOUTS[kind];
  // The mesh ref exposes the GPU instance matrix buffer after mount.
  const foliage = useRef<THREE.InstancedMesh>(null);
  // Color varies subtly per leaflet while retaining one coherent living green.
  const colors = useMemo(
    () =>
      placements.map(
        (_, index) => new THREE.Color(index % 2 ? "#5e8451" : "#4f7548"),
      ),
    [placements],
  );

  // Upload stable transforms once for this species-specific foliage arrangement.
  useLayoutEffect(() => {
    // React has not connected the instanced mesh during the first render pass.
    if (!foliage.current) return;
    // Reuse one object to compose position, rotation, and scale for every blade.
    const transform = new THREE.Object3D();
    placements.forEach((placement, index) => {
      transform.position.set(...placement.position);
      transform.rotation.set(...placement.rotation);
      transform.scale.set(...placement.scale);
      transform.updateMatrix();
      foliage.current?.setMatrixAt(index, transform.matrix);
      foliage.current?.setColorAt(index, colors[index]);
    });
    // Upload completed matrices and pigment only after every instance is ready.
    foliage.current.instanceMatrix.needsUpdate = true;
    if (foliage.current.instanceColor)
      foliage.current.instanceColor.needsUpdate = true;
    foliage.current.computeBoundingSphere();
  }, [colors, placements]);

  // One physical material gives thin green tissue quiet translucency and sheen.
  return (
    <instancedMesh
      ref={foliage}
      args={[geometry, undefined, placements.length]}
      castShadow
    >
      <meshPhysicalMaterial
        vertexColors
        color="#ffffff"
        roughness={0.8}
        sheen={0.22}
        sheenColor="#90aa77"
        sheenRoughness={0.86}
        transmission={0.01}
        thickness={0.025}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}
