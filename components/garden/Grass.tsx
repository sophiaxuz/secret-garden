// React calculates the deterministic blade layout once and applies it after mounting.
import { useLayoutEffect, useMemo, useRef } from "react";
// Three supplies the reusable transform and color objects for instancing.
import * as THREE from "three";
// Shared dimensions keep every blade inside the habitat and away from the path.
import { GARDEN_LAYOUT } from "./garden-layout";

// This is the number of candidate positions scattered across the garden.
const GRASS_BLADE_CANDIDATES = 320;
// One light and one dark green reproduce the previous alternating grass colors.
const LIGHT_GRASS = new THREE.Color("#79905c");
const DARK_GRASS = new THREE.Color("#57724c");

// Each record contains everything needed to transform and color one shared blade.
type GrassBlade = {
  // Keep the original index so rotations, heights, and colors remain deterministic.
  index: number;
  // X and Z place the blade horizontally within the garden.
  x: number;
  z: number;
};

// Render the complete field as one instanced mesh instead of hundreds of mesh objects.
export function Grass() {
  // Calculate the blade layout only when this module first enters the scene.
  const blades = useMemo(() => {
    // Calculate the complete walkable width for deterministic scattering.
    const gardenWidth = GARDEN_LAYOUT.bounds.maxX - GARDEN_LAYOUT.bounds.minX;
    // Calculate the complete walkable depth for the same reason.
    const gardenDepth = GARDEN_LAYOUT.bounds.maxZ - GARDEN_LAYOUT.bounds.minZ;
    // Build every candidate and discard only blades that would cover the path.
    return Array.from({ length: GRASS_BLADE_CANDIDATES }, (_, index) => {
      // Modular arithmetic scatters X positions predictably across the field.
      const x = ((index * 2.37) % gardenWidth) + GARDEN_LAYOUT.bounds.minX;
      // A different multiplier prevents Z positions from repeating with X.
      const z = ((index * 4.13) % gardenDepth) + GARDEN_LAYOUT.bounds.minZ;
      // Keep the middle clear so the grass does not cover the path.
      if (Math.abs(x) < GARDEN_LAYOUT.pathWidth / 2 + 0.35) return null;
      // Retain only the small values needed to build this instance later.
      return { index, x, z };
    }).filter((blade): blade is GrassBlade => blade !== null);
  }, []);
  // This ref exposes the single Three.js instanced mesh after it mounts.
  const grass = useRef<THREE.InstancedMesh>(null);

  // Fill the shared mesh with one matrix and color for every visible blade.
  useLayoutEffect(() => {
    // Stop until React has attached the Three.js mesh to the ref.
    if (!grass.current) return;
    // Keep one stable reference so the loop does not repeatedly inspect the ref.
    const grassMesh = grass.current;
    // Reuse one temporary object while composing all instance matrices.
    const transform = new THREE.Object3D();
    // Apply the deterministic transform and color to each instance slot.
    blades.forEach((blade, instanceIndex) => {
      // Preserve the original position and varied leaning direction.
      transform.position.set(blade.x, 0.2, blade.z);
      transform.rotation.set(
        0,
        blade.index * 0.7,
        ((blade.index % 3) - 1) * 0.14,
      );
      // Scale one unit-height cone to preserve the previous height variation.
      transform.scale.set(1, 0.4 + (blade.index % 5) * 0.06, 1);
      // Convert position, rotation, and scale into one GPU instance matrix.
      transform.updateMatrix();
      // Store that matrix in this blade's instance slot.
      grassMesh.setMatrixAt(instanceIndex, transform.matrix);
      // Preserve the original alternating green palette per blade.
      grassMesh.setColorAt(
        instanceIndex,
        blade.index % 3 ? DARK_GRASS : LIGHT_GRASS,
      );
    });
    // Tell Three.js to upload the completed matrices to the GPU.
    grassMesh.instanceMatrix.needsUpdate = true;
    // Tell Three.js to upload the optional per-instance colors as well.
    if (grassMesh.instanceColor) grassMesh.instanceColor.needsUpdate = true;
    // Recalculate the shared bounds so off-screen grass can be culled correctly.
    grassMesh.computeBoundingSphere();
  }, [blades]);

  // One shared geometry and material now render every grass blade in one draw call.
  return (
    <instancedMesh ref={grass} args={[undefined, undefined, blades.length]}>
      {/* A unit-height cone receives each blade's individual height through its matrix. */}
      <coneGeometry args={[0.035, 1, 5]} />
      {/* Instance colors let one material preserve both greens across all blades. */}
      <meshStandardMaterial vertexColors roughness={1} />
    </instancedMesh>
  );
}
