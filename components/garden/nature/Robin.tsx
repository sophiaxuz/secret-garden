// The robin uses the shared render loop for subtle living motion.
import { useFrame } from "@react-three/fiber";
// A ref exposes the bird's outer group to the animation callback.
import { useRef } from "react";
// Three provides the type used by that group ref.
import * as THREE from "three";

// Build a small stylized European robin perched beside the path.
export function Robin({ animated = true }: { animated?: boolean }) {
  // This group contains every visible part of the bird.
  const robin = useRef<THREE.Group>(null);

  // Add breathing, head-turning, and occasional hopping motion.
  useFrame(({ clock }) => {
    // Preserve the animal while stopping continuous motion when requested.
    if (!animated) return;
    // Wait until the group exists in the scene.
    if (!robin.current) return;
    // Use elapsed time so the motion remains smooth across frame rates.
    const time = clock.elapsedTime;
    // A gentle vertical movement suggests breathing and alertness.
    robin.current.position.y = 0.62 + Math.sin(time * 2.3) * 0.015;
    // Small turns make the robin appear to watch the visitor.
    robin.current.rotation.y = -0.45 + Math.sin(time * 0.7) * 0.22;
  });

  // Render the bird from a handful of warm, rounded primitives.
  return (
    <group ref={robin} position={[1.25, 0.62, 1.5]} scale={0.34}>
      {/* A rounded brown shape forms the robin's body. */}
      <mesh scale={[0.75, 1, 0.72]}>
        <sphereGeometry args={[0.55, 18, 12]} />
        <meshStandardMaterial color="#6a4937" roughness={0.95} />
      </mesh>
      {/* The orange-red breast is the robin's defining field mark. */}
      <mesh position={[0, 0.03, 0.39]} scale={[0.54, 0.72, 0.18]}>
        <sphereGeometry args={[0.5, 18, 12]} />
        <meshStandardMaterial color="#c65b35" roughness={0.9} />
      </mesh>
      {/* A smaller sphere creates the head. */}
      <mesh position={[0, 0.58, 0.08]}>
        <sphereGeometry args={[0.38, 18, 12]} />
        <meshStandardMaterial color="#574237" roughness={0.95} />
      </mesh>
      {/* Two tiny dark spheres create the eyes. */}
      <mesh position={[-0.2, 0.68, 0.35]}>
        <sphereGeometry args={[0.045, 8, 6]} />
        <meshBasicMaterial color="#0e1110" />
      </mesh>
      <mesh position={[0.2, 0.68, 0.35]}>
        <sphereGeometry args={[0.045, 8, 6]} />
        <meshBasicMaterial color="#0e1110" />
      </mesh>
      {/* A short cone becomes the pointed beak. */}
      <mesh position={[0, 0.57, 0.49]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.08, 0.28, 8]} />
        <meshStandardMaterial color="#26231d" roughness={0.9} />
      </mesh>
      {/* A flattened shape behind the body suggests a tail. */}
      <mesh
        position={[0, -0.12, -0.56]}
        rotation={[0.3, 0, 0]}
        scale={[0.38, 0.12, 0.75]}
      >
        <sphereGeometry args={[0.5, 12, 8]} />
        <meshStandardMaterial color="#4a392f" roughness={1} />
      </mesh>
    </group>
  );
}
