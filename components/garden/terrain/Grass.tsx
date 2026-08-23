// React builds shared geometry and deterministic tuft transforms once per mount.
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
// Three supplies the reusable transform and color objects for instancing.
import * as THREE from "three";
// Shared dimensions keep every tuft inside the habitat and away from the path.
import { GARDEN_LAYOUT } from "../garden-layout";
// This factory creates seven fine ribbon blades behind one reusable geometry.
import { createGrassTuftGeometry } from "./grass-geometry";

// A generous number of small tufts produces a meadow without extra draw calls.
const GRASS_TUFT_CANDIDATES = 1100;
// A restrained palette keeps nearby clumps varied without looking striped.
const GRASS_COLORS = [
  new THREE.Color("#78905f"),
  new THREE.Color("#657f54"),
  new THREE.Color("#8a9b68"),
] as const;

// Convert an index and salt into a repeatable irregular value between zero and one.
function seededUnit(index: number, salt: number): number {
  // Sine breaks the previous diagonal placement pattern while remaining deterministic.
  const wave = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  // Removing the integer portion leaves a stable positive fractional value.
  return wave - Math.floor(wave);
}

// Each record contains everything needed to transform and color one shared tuft.
type GrassTuft = {
  // Keep the original index so rotations, heights, and colors remain deterministic.
  index: number;
  // X and Z place the tuft horizontally within the garden.
  x: number;
  z: number;
};

// Render the complete field as one instanced mesh instead of hundreds of mesh objects.
export function Grass() {
  // Calculate the tuft layout only when this module first enters the scene.
  const tufts = useMemo(() => {
    // Calculate the complete walkable width for deterministic scattering.
    const gardenWidth = GARDEN_LAYOUT.bounds.maxX - GARDEN_LAYOUT.bounds.minX;
    // Calculate the complete walkable depth for the same reason.
    const gardenDepth = GARDEN_LAYOUT.bounds.maxZ - GARDEN_LAYOUT.bounds.minZ;
    // Build every candidate and discard only tufts that would cover the path.
    return Array.from({ length: GRASS_TUFT_CANDIDATES }, (_, index) => {
      // Independent seeded values scatter X without visible rows or diagonals.
      const x = GARDEN_LAYOUT.bounds.minX + seededUnit(index, 1) * gardenWidth;
      // A different salt gives Z an unrelated but equally stable distribution.
      const z = GARDEN_LAYOUT.bounds.minZ + seededUnit(index, 2) * gardenDepth;
      // Keep the middle clear so the grass does not cover the path.
      if (Math.abs(x) < GARDEN_LAYOUT.pathWidth / 2 + 0.35) return null;
      // Retain only the small values needed to build this instance later.
      return { index, x, z };
    }).filter((tuft): tuft is GrassTuft => tuft !== null);
  }, []);
  // Build one normalized seven-blade tuft shared by every field instance.
  const tuftGeometry = useMemo(() => createGrassTuftGeometry(), []);
  // This ref exposes the single Three.js instanced mesh after it mounts.
  const grass = useRef<THREE.InstancedMesh>(null);

  // Release the manually created geometry when the grass field unmounts.
  useEffect(() => {
    // Disposal frees its GPU buffers after React removes the instanced mesh.
    return () => tuftGeometry.dispose();
  }, [tuftGeometry]);

  // Fill the shared mesh with one matrix and color for every visible tuft.
  useLayoutEffect(() => {
    // Stop until React has attached the Three.js mesh to the ref.
    if (!grass.current) return;
    // Keep one stable reference so the loop does not repeatedly inspect the ref.
    const grassMesh = grass.current;
    // Reuse one temporary object while composing all instance matrices.
    const transform = new THREE.Object3D();
    // Apply the deterministic transform and color to each instance slot.
    tufts.forEach((tuft, instanceIndex) => {
      // Ground every ribbon base just above the floor to prevent z-fighting.
      transform.position.set(tuft.x, 0.008, tuft.z);
      // Seeded rotation stops neighboring tufts from facing in repeated steps.
      transform.rotation.set(0, seededUnit(tuft.index, 3) * Math.PI * 2, 0);
      // Gently vary every axis so the meadow never repeats one obvious silhouette.
      transform.scale.set(
        0.82 + seededUnit(tuft.index, 4) * 0.34,
        0.3 + seededUnit(tuft.index, 5) * 0.2,
        0.82 + seededUnit(tuft.index, 6) * 0.34,
      );
      // Convert position, rotation, and scale into one GPU instance matrix.
      transform.updateMatrix();
      // Store that matrix in this tuft's instance slot.
      grassMesh.setMatrixAt(instanceIndex, transform.matrix);
      // Choose one muted green deterministically for subtle meadow variation.
      grassMesh.setColorAt(
        instanceIndex,
        GRASS_COLORS[
          Math.floor(seededUnit(tuft.index, 7) * GRASS_COLORS.length)
        ],
      );
    });
    // Tell Three.js to upload the completed matrices to the GPU.
    grassMesh.instanceMatrix.needsUpdate = true;
    // Tell Three.js to upload the optional per-instance colors as well.
    if (grassMesh.instanceColor) grassMesh.instanceColor.needsUpdate = true;
    // Recalculate the shared bounds so off-screen grass can be culled correctly.
    grassMesh.computeBoundingSphere();
  }, [tufts]);

  // One shared geometry and material render every grass tuft in one draw call.
  return (
    <instancedMesh ref={grass} args={[tuftGeometry, undefined, tufts.length]}>
      {/* Instance colors let one material preserve all three greens across the field. */}
      <meshStandardMaterial
        vertexColors
        roughness={0.92}
        metalness={0}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}
