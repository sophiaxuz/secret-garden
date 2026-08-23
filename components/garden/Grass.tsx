// React builds shared geometry and deterministic tuft transforms once per mount.
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
// Three supplies the reusable transform and color objects for instancing.
import * as THREE from "three";
// Shared dimensions keep every tuft inside the habitat and away from the path.
import { GARDEN_LAYOUT } from "./garden-layout";
// This factory creates three soft ribbon blades behind one reusable geometry.
import { createGrassTuftGeometry } from "./grass-geometry";

// More small tufts create ground cover without increasing draw-call count.
const GRASS_TUFT_CANDIDATES = 720;
// One light and one dark green reproduce the previous alternating grass colors.
const LIGHT_GRASS = new THREE.Color("#79905c");
const DARK_GRASS = new THREE.Color("#57724c");

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
      // Modular arithmetic scatters X positions predictably across the field.
      const x = ((index * 2.37) % gardenWidth) + GARDEN_LAYOUT.bounds.minX;
      // A different multiplier prevents Z positions from repeating with X.
      const z = ((index * 4.13) % gardenDepth) + GARDEN_LAYOUT.bounds.minZ;
      // Keep the middle clear so the grass does not cover the path.
      if (Math.abs(x) < GARDEN_LAYOUT.pathWidth / 2 + 0.35) return null;
      // Retain only the small values needed to build this instance later.
      return { index, x, z };
    }).filter((tuft): tuft is GrassTuft => tuft !== null);
  }, []);
  // Build one normalized three-blade tuft shared by every field instance.
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
      // Rotate complete tufts around Y so their bends face varied directions.
      transform.rotation.set(0, tuft.index * 0.7, 0);
      // Vary width, height, and depth while retaining the soft tuft silhouette.
      transform.scale.set(
        0.82 + (tuft.index % 4) * 0.08,
        0.38 + (tuft.index % 6) * 0.045,
        0.82 + ((tuft.index + 2) % 4) * 0.08,
      );
      // Convert position, rotation, and scale into one GPU instance matrix.
      transform.updateMatrix();
      // Store that matrix in this tuft's instance slot.
      grassMesh.setMatrixAt(instanceIndex, transform.matrix);
      // Preserve the original alternating green palette per tuft.
      grassMesh.setColorAt(
        instanceIndex,
        tuft.index % 3 ? DARK_GRASS : LIGHT_GRASS,
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
      {/* Instance colors let one material preserve both greens across all tufts. */}
      <meshStandardMaterial
        vertexColors
        roughness={1}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}
