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
      {/* A lighter pair of cheek shapes pushes the muzzle beyond the round head. */}
      <mesh position={[-0.105, 0.49, 0.675]} scale={[0.18, 0.15, 0.12]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#c2a17a" roughness={1} />
      </mesh>
      <mesh position={[0.105, 0.49, 0.675]} scale={[0.18, 0.15, 0.12]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#c2a17a" roughness={1} />
      </mesh>
      {/* Two dark eyes sit on the forward-facing side of the head. */}
      <mesh position={[-0.145, 0.64, 0.68]}>
        <sphereGeometry args={[0.07, 12, 8]} />
        <meshStandardMaterial color="#171714" roughness={0.35} />
      </mesh>
      <mesh position={[0.145, 0.64, 0.68]}>
        <sphereGeometry args={[0.07, 12, 8]} />
        <meshStandardMaterial color="#171714" roughness={0.35} />
      </mesh>
      {/* Tiny highlights keep the black eyes readable in shadow. */}
      <mesh position={[-0.167, 0.665, 0.738]}>
        <sphereGeometry args={[0.018, 8, 6]} />
        <meshBasicMaterial color="#fff7df" />
      </mesh>
      <mesh position={[0.123, 0.665, 0.738]}>
        <sphereGeometry args={[0.018, 8, 6]} />
        <meshBasicMaterial color="#fff7df" />
      </mesh>
      {/* A small dark sphere creates the nose at the tip of the muzzle. */}
      <mesh position={[0, 0.52, 0.815]} scale={[1.15, 0.82, 0.8]}>
        <sphereGeometry args={[0.075, 10, 8]} />
        <meshStandardMaterial color="#201b18" roughness={0.5} />
      </mesh>
      {/* Fine horizontal cylinders suggest whiskers on both cheeks. */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.23, 0.5, 0.72]}>
          <mesh
            rotation={[0, 0, Math.PI / 2]}
            position={[side * 0.1, 0.025, 0]}
          >
            <cylinderGeometry args={[0.006, 0.006, 0.28, 5]} />
            <meshBasicMaterial color="#3d332b" />
          </mesh>
          <mesh
            rotation={[0.18, 0, Math.PI / 2]}
            position={[side * 0.1, -0.035, 0]}
          >
            <cylinderGeometry args={[0.006, 0.006, 0.26, 5]} />
            <meshBasicMaterial color="#3d332b" />
          </mesh>
        </group>
      ))}
      {/* Small forepaws in front of the chest strengthen the animal silhouette. */}
      <mesh
        position={[-0.18, 0.08, 0.5]}
        rotation={[0.35, 0, -0.22]}
        scale={[0.13, 0.28, 0.12]}
      >
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#76543c" roughness={1} />
      </mesh>
      <mesh
        position={[0.18, 0.08, 0.5]}
        rotation={[0.35, 0, 0.22]}
        scale={[0.13, 0.28, 0.12]}
      >
        <sphereGeometry args={[1, 10, 8]} />
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
