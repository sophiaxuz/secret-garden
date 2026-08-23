// The render-loop hook lets the butterfly move and flap continuously.
import { useFrame } from "@react-three/fiber";
// Refs give animation code direct access to Three.js groups.
import { useRef } from "react";
// Three provides the Group type and double-sided material constant.
import * as THREE from "three";
// The shared point type gives butterfly origins the same habitat vocabulary as animals.
import type { HabitatPoint } from "./animal-habitats";

// These values make each butterfly follow a different route and color palette.
type ButterflyProps = {
  // Animation can be disabled for visitors who request reduced motion.
  animated?: boolean;
  color: string;
  origin: HabitatPoint;
  phase?: number;
};

// Build a lightweight butterfly from a body and four moving wings.
export function Butterfly({
  animated = true,
  color,
  origin,
  phase = 0,
}: ButterflyProps) {
  // This ref moves the whole butterfly through the garden.
  const butterfly = useRef<THREE.Group>(null);
  // These refs animate the left and right wing pairs independently.
  const leftWing = useRef<THREE.Group>(null);
  const rightWing = useRef<THREE.Group>(null);

  // Update position, orientation, and wing angle before every frame.
  useFrame(({ clock }) => {
    // Stop until React has connected all refs to Three.js objects.
    if (!butterfly.current || !leftWing.current || !rightWing.current) return;
    // Keep each butterfly calmly resting at its own origin for reduced motion.
    if (!animated) {
      butterfly.current.position.set(origin[0], origin[1], origin[2]);
      butterfly.current.rotation.y = 0;
      leftWing.current.rotation.y = 0;
      rightWing.current.rotation.y = 0;
      return;
    }
    // Add a phase offset so multiple butterflies do not move in formation.
    const time = clock.elapsedTime + phase;
    // Drift around the origin in a loose horizontal figure-eight.
    butterfly.current.position.set(
      origin[0] + Math.sin(time * 0.45) * 1.4,
      origin[1] + Math.sin(time * 1.1) * 0.28,
      origin[2] + Math.sin(time * 0.3) * Math.cos(time * 0.45) * 1.6,
    );
    // Face approximately along the current curved flight path.
    butterfly.current.rotation.y = Math.cos(time * 0.45) * 0.8;
    // Oscillate both wings in opposite directions to create flapping.
    const flap = Math.sin(time * 10) * 0.65;
    leftWing.current.rotation.y = flap;
    rightWing.current.rotation.y = -flap;
  });

  // Render the animated butterfly group.
  return (
    <group
      ref={butterfly}
      position={[origin[0], origin[1], origin[2]]}
      scale={0.16}
    >
      {/* A narrow dark ellipsoid becomes the body. */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <sphereGeometry args={[0.18, 10, 8]} />
        <meshStandardMaterial color="#25261d" roughness={0.9} />
      </mesh>
      {/* The left pair shares a hinge at the butterfly's body. */}
      <group ref={leftWing}>
        <mesh position={[-0.42, 0.13, 0]} rotation={[0, 0, 0.35]}>
          <circleGeometry args={[0.48, 16]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-0.32, -0.25, 0]} scale={0.7}>
          <circleGeometry args={[0.42, 16]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* The right pair mirrors the left pair across the body. */}
      <group ref={rightWing}>
        <mesh position={[0.42, 0.13, 0]} rotation={[0, 0, -0.35]}>
          <circleGeometry args={[0.48, 16]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.32, -0.25, 0]} scale={0.7}>
          <circleGeometry args={[0.42, 16]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
