// `useMemo` avoids recalculating petal angles unless their count changes.
import { useMemo } from "react";
// Three supplies constants that are not exposed as JSX components.
import * as THREE from "three";

// These values describe one procedural flower instance.
type FlowerProps = {
  // A tuple stores the flower's x, y, and z coordinates.
  position: [number, number, number];
  // This color is applied to every petal.
  color: string;
  // Scale changes the size of the whole flower group.
  scale?: number;
  // Petal count creates visual variation between flowers.
  petals?: number;
  // Bell flowers use cones and point downward.
  bell?: boolean;
};

// Build a complete flower from simple Three.js primitives.
export function Flower({
  position,
  color,
  scale = 1,
  petals = 8,
  bell = false,
}: FlowerProps) {
  // Calculate one evenly spaced angle for every petal.
  const angles = useMemo(
    () =>
      Array.from(
        { length: petals },
        (_, index) => (index * Math.PI * 2) / petals,
      ),
    [petals],
  );

  // Grouping the pieces lets position and scale affect the entire flower.
  return (
    <group position={position} scale={scale}>
      {/* A narrow cylinder forms the stem. */}
      <mesh position={[0, 0.7, 0]}>
        {/* The top and bottom radii differ slightly for an organic taper. */}
        <cylinderGeometry args={[0.025, 0.045, 1.4, 8]} />
        {/* A rough green material keeps the stem from looking plastic. */}
        <meshStandardMaterial color="#34543a" roughness={0.9} />
      </mesh>
      {/* A squashed, rotated sphere becomes a simple leaf. */}
      <mesh position={[-0.14, 0.5, 0]} rotation={[0, 0, -0.8]}>
        <sphereGeometry args={[0.2, 12, 8]} />
        <meshStandardMaterial color="#55764d" roughness={1} />
      </mesh>
      {/* This group holds the entire flower head above the stem. */}
      <group
        position={[0, 1.42, 0]}
        rotation={bell ? [Math.PI, 0, 0] : [0, 0, 0]}
      >
        {/* Turn each calculated angle into one petal mesh. */}
        {angles.map((angle) => (
          <mesh
            // The angle is unique within this flower, so React can use it as a key.
            key={angle}
            // Sine and cosine place the petal around a circle.
            position={[Math.cos(angle) * 0.19, Math.sin(angle) * 0.19, 0]}
            // Rotate the petal so it points away from the center.
            rotation={[0, 0, angle - Math.PI / 2]}
          >
            {/* Bell flowers use cones; ordinary flowers use stretched spheres. */}
            {bell ? (
              <coneGeometry args={[0.14, 0.36, 12]} />
            ) : (
              <sphereGeometry args={[0.22, 0.08, 0.08, 16, 8]} />
            )}
            {/* Render both sides so petals remain visible from behind. */}
            <meshStandardMaterial
              color={color}
              roughness={0.65}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
        {/* Ordinary flowers receive a yellow center; bells remain hollow. */}
        {!bell && (
          <mesh position={[0, 0, 0.045]}>
            <sphereGeometry args={[0.13, 20, 12]} />
            <meshStandardMaterial color="#d8a83b" roughness={0.9} />
          </mesh>
        )}
      </group>
    </group>
  );
}
