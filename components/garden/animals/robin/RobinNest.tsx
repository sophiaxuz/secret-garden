// Three supplies double-sided material rendering for the nest's shallow inner bowl.
import * as THREE from "three";
// HabitatPoint keeps this decorative home aligned with the robin's world coordinates.
import type { HabitatPoint } from "../animal-habitats";

// The nest needs only one permanent world-space home position.
type RobinNestProps = {
  // Position is derived from the named home tree rather than authored independently.
  position: HabitatPoint;
};

// Render a small woven bowl that remains in Threshold oak while the robin explores.
export function RobinNest({ position }: RobinNestProps) {
  // One group lets the complete nest sit naturally across its supporting branch.
  return (
    <group position={[...position]} rotation={[0.04, 0.35, -0.03]}>
      {/* A rounded lower shell gives the nest a readable bowl silhouette from below. */}
      <mesh position={[0, -0.07, 0]} scale={[1, 0.48, 1]}>
        <sphereGeometry args={[0.3, 18, 10]} />
        <meshStandardMaterial color="#725139" roughness={1} />
      </mesh>
      {/* A thick woven rim hides the closed shell top and frames the dark interior. */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.24, 0.065, 8, 22]} />
        <meshStandardMaterial color="#8d6948" roughness={1} />
      </mesh>
      {/* The shadowed inner disk makes the object read as a nest rather than a bun. */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.22, 20]} />
        <meshStandardMaterial
          color="#3e2d22"
          roughness={1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Three crossed fibres suggest loose grass without adding many tiny meshes. */}
      {[-0.55, 0.08, 0.66].map((angle) => (
        <mesh
          key={angle}
          position={[0, 0.035, 0]}
          rotation={[Math.PI / 2, angle, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.012, 0.018, 0.64, 5]} />
          <meshStandardMaterial color="#aa8255" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
