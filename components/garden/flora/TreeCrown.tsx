// Layout effects populate the complete canopy before its first visible frame.
import { useLayoutEffect, useRef } from "react";
// Three supplies colors, instance transforms, and double-sided leaf rendering.
import * as THREE from "three";
// One shared deterministic hash keeps procedural placements stable and consistent.
import { seededUnit } from "../deterministic-random";
// Species styling keeps one botanical renderer varied across every named tree.
import type { TreeVisualStyle } from "./garden-trees";
// The shared lobed outline gives every instance a recognisable leaf silhouette.
import { createTreeLeafShape } from "./tree-leaf-shape";

// Many small leaves create a full crown while remaining one draw call per tree.
const CANOPY_LEAF_COUNT = 480;
// A golden angle distributes leaves without visible latitude or longitude rows.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
// Build the immutable leaf outline once for every tree crown.
const TREE_LEAF_SHAPE = createTreeLeafShape();

// Convert an index and salt into one repeatable irregular value from zero to one.
function seededUnit(index: number, salt: number): number {
  // A sine hash gives every transform property an unrelated stable rhythm.
  const wave = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  // Removing the integer part leaves a positive deterministic fraction.
  return wave - Math.floor(wave);
}
// Describe the complete airy leaf distribution once at module load time.
const CANOPY_LEAVES = Array.from({ length: CANOPY_LEAF_COUNT }, (_, index) => {
  // Spread vertical positions throughout a sphere instead of on flat layers.
  const normalizedY = seededUnit(index, 1) * 2 - 1;
  // Golden-angle rotation avoids visible spirals when combined with jitter.
  const angle = index * GOLDEN_ANGLE + seededUnit(index, 2) * 0.42;
  // A linear radius deliberately retains enough leaves near the crown's center.
  const volumeRadius = 0.06 + seededUnit(index, 3) * 1.02;
  // Horizontal radius narrows naturally near the canopy's top and bottom.
  const horizontalRadius =
    Math.sqrt(Math.max(0, 1 - normalizedY * normalizedY)) * volumeRadius;
  // Return stable position, orientation, scale, and palette information.
  return {
    position: [
      Math.cos(angle) * horizontalRadius * 1.5,
      normalizedY * volumeRadius * 1.22,
      Math.sin(angle) * horizontalRadius * 1.36,
    ],
    rotation: [
      seededUnit(index, 4) * Math.PI,
      angle,
      seededUnit(index, 5) * Math.PI * 2,
    ],
    scale: 0.38 + seededUnit(index, 6) * 0.34,
    colorIndex: Math.floor(seededUnit(index, 7) * 3),
  } as const;
});

// Small fruit or warm leaves appear only on species whose style requests them.
const ACCENT_POINTS = Array.from({ length: 18 }, (_, index) => {
  // Use a separate angular rhythm so accents never line up with leaf placement.
  const angle = index * 1.71;
  // Stagger height throughout the lower two thirds of the crown.
  const height = -0.58 + (index % 6) * 0.2;
  // Slight radius changes scatter accents across front, middle, and back.
  const radius = 0.62 + (index % 4) * 0.13;
  // Return one stable local point around the visible branch network.
  return [Math.cos(angle) * radius, height, Math.sin(angle) * radius] as const;
});

// Render a detailed, light-filtering crown without any solid foliage blobs.
export function TreeCrown({
  style,
  highlighted,
}: {
  // Style controls palette, crown proportion, and optional species accents.
  style: TreeVisualStyle;
  // Highlight applies a gentle shared glow to the inspectable tree.
  highlighted: boolean;
}) {
  // Refs expose the leaf and optional accent instance collections after mount.
  const leaves = useRef<THREE.InstancedMesh>(null);
  const accents = useRef<THREE.InstancedMesh>(null);

  // Fill transforms and colors whenever a named tree's style changes.
  useLayoutEffect(() => {
    // Reuse one transform and color instead of allocating per leaf.
    const transform = new THREE.Object3D();
    const color = new THREE.Color();
    // Position every leaf independently throughout the irregular crown volume.
    CANOPY_LEAVES.forEach((leaf, index) => {
      if (!leaves.current) return;
      transform.position.set(
        leaf.position[0] * style.crownScale[0],
        leaf.position[1] * style.crownScale[1],
        leaf.position[2] * style.crownScale[2],
      );
      transform.rotation.set(...leaf.rotation);
      transform.scale.setScalar(leaf.scale);
      transform.updateMatrix();
      leaves.current.setMatrixAt(index, transform.matrix);
      leaves.current.setColorAt(
        index,
        color.set(style.foliage[leaf.colorIndex]),
      );
    });
    // Scatter optional fruit or warm leaf accents within the same silhouette.
    ACCENT_POINTS.forEach((point, index) => {
      if (!accents.current) return;
      transform.position.set(
        point[0] * style.crownScale[0],
        point[1] * style.crownScale[1],
        point[2] * style.crownScale[2],
      );
      transform.rotation.set(0, index, 0);
      transform.scale.setScalar(0.055 + (index % 3) * 0.012);
      transform.updateMatrix();
      accents.current.setMatrixAt(index, transform.matrix);
    });
    // Upload the completed matrices and per-leaf color palette once.
    [leaves.current, accents.current].forEach((mesh) => {
      if (!mesh) return;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
  }, [style]);

  // Position the open canopy around the visible upper branch structure.
  return (
    <group position={[0, 4.12, 0]}>
      {/* Hundreds of true leaf silhouettes form one airy instanced canopy. */}
      <instancedMesh
        ref={leaves}
        args={[undefined, undefined, CANOPY_LEAF_COUNT]}
        userData={{ shadowCaster: false }}
      >
        <shapeGeometry args={[TREE_LEAF_SHAPE, 1]} />
        <meshStandardMaterial
          vertexColors
          roughness={0.94}
          side={THREE.DoubleSide}
          emissive={highlighted ? "#6f9868" : "#294d31"}
          emissiveIntensity={highlighted ? 0.32 : 0.15}
        />
      </instancedMesh>
      {/* Tiny species accents add interest without restoring a solid crown mass. */}
      {style.accent && (
        <instancedMesh
          ref={accents}
          args={[undefined, undefined, ACCENT_POINTS.length]}
        >
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color={style.accent} roughness={0.86} />
        </instancedMesh>
      )}
    </group>
  );
}
