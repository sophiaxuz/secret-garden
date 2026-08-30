// Layout effects populate two instanced meshes after their refs become available.
import { useLayoutEffect, useRef } from "react";
// Three supplies reusable transforms, vectors, and botanical material colours.
import * as THREE from "three";

// Stamens vary with the flower centre while remaining one reusable detail module.
type FlowerStamensProps = {
  // Count creates a convincing ring without individual React mesh objects.
  count: number;
  // Radius keeps each species' stamens proportional to its receptacle.
  radius: number;
  // Anther colour distinguishes pollen-rich gold from cream bell interiors.
  color?: string;
  // Composite flower discs scatter florets while roses retain a pollen ring.
  arrangement?: "ring" | "disc";
};

// Render fine filaments and pollen-bearing anthers through two instanced draw calls.
export function FlowerStamens({
  count,
  radius,
  color = "#d8ad45",
  arrangement = "ring",
}: FlowerStamensProps) {
  // Filaments are slender cylinders leaning gently away from the flower centre.
  const filaments = useRef<THREE.InstancedMesh>(null);
  // Anthers are tiny elongated pollen forms positioned at each filament tip.
  const anthers = useRef<THREE.InstancedMesh>(null);

  // Compose every stamen transform once whenever its authored ring changes.
  useLayoutEffect(() => {
    // Both meshes must exist before their matching transforms can be uploaded.
    if (!filaments.current || !anthers.current) return;
    // Reuse one object for all matrix composition to avoid short-lived allocations.
    const transform = new THREE.Object3D();
    // The cylinder's original axis points upward before each radial lean.
    const up = new THREE.Vector3(0, 1, 0);
    // Reuse direction and base vectors throughout the deterministic ring loop.
    const direction = new THREE.Vector3();
    const base = new THREE.Vector3();

    // Position one complete filament-and-anther pair in every ring slot.
    for (let index = 0; index < count; index += 1) {
      // Golden-angle spacing removes the perfect manufactured spokes of disc florets.
      const angle =
        arrangement === "disc"
          ? index * Math.PI * (3 - Math.sqrt(5))
          : (index * Math.PI * 2) / count;
      // Alternating heights imitate natural developmental variation.
      const height = 0.085 + (index % 3) * 0.009;
      // Each base begins near the receptacle edge at a very small elevation.
      const radialDistance =
        arrangement === "disc"
          ? Math.sqrt((index + 0.5) / count) * radius
          : radius;
      base.set(
        Math.sin(angle) * radialDistance,
        0.065,
        Math.cos(angle) * radialDistance,
      );
      // A mostly vertical direction leans gently away from the centre.
      direction
        .set(Math.sin(angle) * 0.24, 1, Math.cos(angle) * 0.24)
        .normalize();
      // Place the cylinder midpoint halfway along the chosen filament direction.
      transform.position.copy(base).addScaledVector(direction, height * 0.5);
      // Rotate its original upward axis onto the outward-leaning direction.
      transform.quaternion.setFromUnitVectors(up, direction);
      // Unit geometry becomes a fine filament through this non-uniform scale.
      transform.scale.set(1, height, 1);
      // Convert the authored transform into one instance matrix.
      transform.updateMatrix();
      // Store the filament matrix in its matching GPU slot.
      filaments.current.setMatrixAt(index, transform.matrix);

      // Position the anther precisely at the filament's outer tip.
      transform.position.copy(base).addScaledVector(direction, height);
      // Keep anthers aligned with the same organic outward lean.
      transform.quaternion.setFromUnitVectors(up, direction);
      // Slight alternating thickness stops the pollen ring looking manufactured.
      const antherScale = 0.86 + (index % 2) * 0.16;
      transform.scale.set(
        antherScale * 0.78,
        antherScale * 1.35,
        antherScale * 0.78,
      );
      // Store the completed tiny ellipsoid transform.
      transform.updateMatrix();
      anthers.current.setMatrixAt(index, transform.matrix);
    }
    // Upload both completed matrix buffers to the GPU.
    filaments.current.instanceMatrix.needsUpdate = true;
    anthers.current.instanceMatrix.needsUpdate = true;
    // Updated bounds preserve correct culling around the complete flower centre.
    filaments.current.computeBoundingSphere();
    anthers.current.computeBoundingSphere();
  }, [arrangement, count, radius]);

  // A fragment keeps the two instanced botanical details under one public boundary.
  return (
    <>
      {/* Fine ivory filaments remain visible between petals and pollen tips. */}
      <instancedMesh ref={filaments} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.0035, 0.0045, 1, 5]} />
        <meshStandardMaterial color="#eadca8" roughness={0.78} />
      </instancedMesh>
      {/* Tiny elongated anthers provide realistic centre texture without spheres. */}
      <instancedMesh ref={anthers} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.011, 7, 5]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </instancedMesh>
    </>
  );
}
