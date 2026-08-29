// Drei loads the project-owned bark material once through its texture cache.
import { useTexture } from "@react-three/drei";
// Layout effects populate repeated root and branch transforms before painting.
import { useLayoutEffect, useRef } from "react";
// Three supplies texture settings and reusable transform mathematics.
import * as THREE from "three";
// Shared measurements keep the squirrel perch aligned with visible bark.
import {
  TREE_BRANCH_LENGTH,
  TREE_BRANCH_LOCAL_POSITION,
  TREE_TRUNK_HEIGHT,
  TREE_TRUNK_RADIUS,
} from "./garden-trees";

// A tapered segment joins two local points with one configurable thickness.
type TaperedSegment = {
  // Start is the wider end attached to trunk or soil.
  readonly start: readonly [number, number, number];
  // End is the narrower outward tip.
  readonly end: readonly [number, number, number];
  // Thickness scales the shared tapered cylinder without adding geometry.
  readonly thickness: number;
};

// These roots break the cylinder silhouette where an old tree meets the soil.
const ROOT_SEGMENTS: readonly TaperedSegment[] = [
  { start: [0, 0.24, 0], end: [0.9, 0.04, 0.16], thickness: 1.15 },
  { start: [0, 0.2, 0], end: [-0.72, 0.03, 0.48], thickness: 0.95 },
  { start: [0, 0.18, 0], end: [-0.3, 0.03, -0.82], thickness: 0.82 },
  { start: [0, 0.2, 0], end: [0.5, 0.03, -0.64], thickness: 0.88 },
] as const;

// The visible trunk continues into the crown instead of ending beneath it.
const VISIBLE_TRUNK_HEIGHT = TREE_TRUNK_HEIGHT + 0.9;
// A slender tip makes the single trunk taper naturally among the upper limbs.
const VISIBLE_TRUNK_TIP_RADIUS = 0.07;

// The first branch preserves Hazel's measured perch; the rest fill the crown.
const BRANCH_SEGMENTS: readonly TaperedSegment[] = [
  {
    start: [
      TREE_BRANCH_LOCAL_POSITION[0] - TREE_BRANCH_LENGTH / 2,
      TREE_BRANCH_LOCAL_POSITION[1],
      TREE_BRANCH_LOCAL_POSITION[2],
    ],
    end: [
      TREE_BRANCH_LOCAL_POSITION[0] + TREE_BRANCH_LENGTH / 2,
      TREE_BRANCH_LOCAL_POSITION[1],
      TREE_BRANCH_LOCAL_POSITION[2],
    ],
    thickness: 1,
  },
  { start: [0, 2.7, 0], end: [-1.12, 3.62, 0.38], thickness: 0.68 },
  { start: [0, 3.12, 0], end: [0.64, 4.02, -0.92], thickness: 0.56 },
  { start: [0, 3.28, 0], end: [-0.5, 4.16, -0.86], thickness: 0.52 },
  { start: [0, 2.86, 0], end: [0.48, 3.56, 0.98], thickness: 0.62 },
  // Fine forked branchlets remain visible through the new open canopy.
  { start: [-0.72, 3.3, 0.25], end: [-1.35, 3.92, 0.68], thickness: 0.3 },
  { start: [-0.7, 3.32, 0.24], end: [-1.18, 3.86, -0.12], thickness: 0.27 },
  { start: [0.46, 3.74, -0.66], end: [1.08, 4.34, -1.08], thickness: 0.27 },
  { start: [0.42, 3.72, -0.62], end: [0.2, 4.42, -1.22], thickness: 0.24 },
  { start: [-0.34, 3.92, -0.58], end: [-0.96, 4.48, -0.9], thickness: 0.25 },
  { start: [0.34, 3.36, 0.7], end: [0.98, 4.02, 1.14], thickness: 0.29 },
  { start: [0.3, 3.34, 0.68], end: [-0.06, 4.08, 1.3], thickness: 0.25 },
  { start: [0.72, 2.9, 0], end: [1.34, 3.46, 0.28], thickness: 0.27 },
] as const;

// The cylinder's local up direction is rotated onto each organic segment.
const LOCAL_UP = new THREE.Vector3(0, 1, 0);

// Fill one instanced mesh with cylinders connecting all supplied endpoints.
function placeSegments(
  mesh: THREE.InstancedMesh,
  segments: readonly TaperedSegment[],
) {
  // Reuse one object and two vectors rather than allocating inside the loop.
  const transform = new THREE.Object3D();
  const start = new THREE.Vector3();
  const end = new THREE.Vector3();
  const direction = new THREE.Vector3();
  // Convert every endpoint description into one complete instance matrix.
  segments.forEach((segment, index) => {
    // Copy readonly tuples into mutable vectors used by Three.js mathematics.
    start.set(...segment.start);
    end.set(...segment.end);
    // Direction length becomes the cylinder's local vertical scale.
    direction.subVectors(end, start);
    const length = direction.length();
    // The midpoint places the centered cylinder exactly between its endpoints.
    transform.position.copy(start).add(end).multiplyScalar(0.5);
    // Rotate local up toward the segment while retaining its tapered orientation.
    transform.quaternion.setFromUnitVectors(LOCAL_UP, direction.normalize());
    // Preserve authored thickness while stretching only along the segment length.
    transform.scale.set(segment.thickness, length, segment.thickness);
    transform.updateMatrix();
    mesh.setMatrixAt(index, transform.matrix);
  });
  // Upload all completed transforms in one GPU update.
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
}

// Render textured trunk, branching structure, and grounded root flare together.
export function TreeStructure({ highlighted }: { highlighted: boolean }) {
  // Load the original generated bark texture from this project's public assets.
  const barkTexture = useTexture("/material-oak-bark.webp");
  // These refs expose the two repeated structures after their meshes mount.
  const roots = useRef<THREE.InstancedMesh>(null);
  const branches = useRef<THREE.InstancedMesh>(null);

  // Configure bark sampling and build all repeated segment transforms once.
  useLayoutEffect(() => {
    // Vertical repetition keeps bark plates fine at the tree's world scale.
    // Mirroring joins identical edge pixels and hides seams in the source image.
    barkTexture.wrapS = barkTexture.wrapT = THREE.MirroredRepeatWrapping;
    barkTexture.repeat.set(2, 4);
    barkTexture.colorSpace = THREE.SRGBColorSpace;
    barkTexture.anisotropy = 8;
    barkTexture.needsUpdate = true;
    // Populate each available instanced mesh with its authored structure.
    if (roots.current) placeSegments(roots.current, ROOT_SEGMENTS);
    if (branches.current) placeSegments(branches.current, BRANCH_SEGMENTS);
  }, [barkTexture]);

  // One group keeps every woody form under the parent tree transform.
  return (
    <group>
      {/* Sixteen radial faces soften the former visibly polygonal trunk. */}
      <mesh position={[0, VISIBLE_TRUNK_HEIGHT / 2, 0]}>
        <cylinderGeometry
          args={[
            VISIBLE_TRUNK_TIP_RADIUS,
            TREE_TRUNK_RADIUS,
            VISIBLE_TRUNK_HEIGHT,
            16,
          ]}
        />
        <meshStandardMaterial
          map={barkTexture}
          color="#c1b39c"
          roughness={0.96}
          emissive={highlighted ? "#756f46" : "#000000"}
          emissiveIntensity={highlighted ? 0.2 : 0}
        />
      </mesh>
      {/* Four tapered roots anchor the trunk instead of ending in a flat circle. */}
      <instancedMesh
        ref={roots}
        args={[undefined, undefined, ROOT_SEGMENTS.length]}
      >
        <cylinderGeometry args={[0.08, 0.26, 1, 10]} />
        <meshStandardMaterial map={barkTexture} color="#b8aa92" roughness={1} />
      </instancedMesh>
      {/* Five true branches create depth beneath the layered crown in one draw call. */}
      <instancedMesh
        ref={branches}
        args={[undefined, undefined, BRANCH_SEGMENTS.length]}
      >
        <cylinderGeometry args={[0.1, 0.17, 1, 12]} />
        <meshStandardMaterial
          map={barkTexture}
          color="#b9ac96"
          roughness={0.98}
        />
      </instancedMesh>
    </group>
  );
}
