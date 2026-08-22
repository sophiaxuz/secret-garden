// The squirrel's tail and body animate inside the render loop.
import { useFrame } from "@react-three/fiber";
// Refs retain the mutable Three.js groups between React renders.
import { useRef } from "react";
// Three provides the Group type used by the refs.
import * as THREE from "three";

// Build a small squirrel pausing near the edge of the path.
export function Squirrel({ animated = true }: { animated?: boolean }) {
  // This ref moves the whole animal in small alert motions.
  const squirrel = useRef<THREE.Group>(null);
  // This ref swishes the tail separately from the body.
  const tail = useRef<THREE.Group>(null);

  // Animate the squirrel without causing React component rerenders.
  useFrame(({ clock }) => {
    // Preserve the animal while stopping continuous motion when requested.
    if (!animated) return;
    // Wait until both groups are connected to the scene.
    if (!squirrel.current || !tail.current) return;
    // Use one time value so the movements remain coordinated.
    const time = clock.elapsedTime;
    // Let the body rise and fall as though sniffing the ground.
    squirrel.current.position.y = 0.26 + Math.abs(Math.sin(time * 0.9)) * 0.035;
    // Give the large tail a slow, independent swish.
    tail.current.rotation.z = -0.35 + Math.sin(time * 1.4) * 0.18;
  });

  // Render a recognizable squirrel silhouette with simple geometry.
  return (
    <group
      ref={squirrel}
      position={[-2.9, 0.26, -1.7]}
      rotation={[0, 0.75, 0]}
      scale={0.42}
    >
      {/* A stretched sphere forms the body. */}
      <mesh scale={[0.72, 0.85, 1]}>
        <sphereGeometry args={[0.55, 16, 10]} />
        <meshStandardMaterial color="#8a6749" roughness={1} />
      </mesh>
      {/* A smaller sphere creates the head. */}
      <mesh position={[0, 0.55, 0.38]}>
        <sphereGeometry args={[0.34, 14, 10]} />
        <meshStandardMaterial color="#916f50" roughness={1} />
      </mesh>
      {/* Two cones create the squirrel's pointed ears. */}
      <mesh position={[-0.19, 0.88, 0.35]}>
        <coneGeometry args={[0.1, 0.28, 8]} />
        <meshStandardMaterial color="#76543c" roughness={1} />
      </mesh>
      <mesh position={[0.19, 0.88, 0.35]}>
        <coneGeometry args={[0.1, 0.28, 8]} />
        <meshStandardMaterial color="#76543c" roughness={1} />
      </mesh>
      {/* The tail is a chain of overlapping ellipsoids in its own moving group. */}
      <group ref={tail} position={[0, 0.3, -0.55]} rotation={[0.2, 0, -0.35]}>
        <mesh position={[0, 0.45, -0.12]} scale={[0.48, 0.9, 0.42]}>
          <sphereGeometry args={[0.62, 16, 10]} />
          <meshStandardMaterial color="#9b7653" roughness={1} />
        </mesh>
        <mesh position={[0, 1.05, 0.02]} scale={[0.38, 0.72, 0.34]}>
          <sphereGeometry args={[0.58, 16, 10]} />
          <meshStandardMaterial color="#a27b57" roughness={1} />
        </mesh>
      </group>
    </group>
  );
}
