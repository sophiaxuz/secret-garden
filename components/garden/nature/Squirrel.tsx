// The squirrel's tail and body animate inside the render loop.
import { useFrame } from "@react-three/fiber";
// Refs retain the mutable Three.js groups between React renders.
import { useRef } from "react";
// Three provides the Group type used by the refs.
import * as THREE from "three";
// One shared target follows the squirrel without registering its many meshes.
import { GardenInteractionTarget } from "../interaction/GardenInteractionTarget";
// Shared habitat data keeps the squirrel's route easy to relocate with the garden.
import { ANIMAL_HABITATS, createRoundTripRoute } from "./animal-habitats";
// The squirrel uses the identity and highlight shared by all animals.
import type { AnimatedAnimalProps } from "./animal-identities";

// Reuse route endpoints so the animation does not allocate vectors each frame.
const {
  start: SQUIRREL_START,
  end: SQUIRREL_END,
  outboundHeading: OUTBOUND_HEADING,
  returnHeading: RETURN_HEADING,
} = createRoundTripRoute(ANIMAL_HABITATS.squirrel);
// Build a small squirrel pausing near the edge of the path.
export function Squirrel({
  animated = true,
  item,
  highlighted = false,
}: AnimatedAnimalProps) {
  // This ref moves the whole animal in small alert motions.
  const squirrel = useRef<THREE.Group>(null);
  // This ref swishes the tail separately from the body.
  const tail = useRef<THREE.Group>(null);
  // Paw refs alternate during a running burst.
  const leftPaw = useRef<THREE.Mesh>(null);
  const rightPaw = useRef<THREE.Mesh>(null);

  // Animate the squirrel without causing React component rerenders.
  useFrame(({ clock }, delta) => {
    // Wait until both groups are connected to the scene.
    if (
      !squirrel.current ||
      !tail.current ||
      !leftPaw.current ||
      !rightPaw.current
    )
      return;
    // Return to a stable grounded pose if reduced motion is enabled live.
    if (!animated) {
      squirrel.current.position.copy(SQUIRREL_START);
      squirrel.current.rotation.set(0, OUTBOUND_HEADING, 0);
      tail.current.rotation.z = -0.35;
      leftPaw.current.rotation.x = 0.35;
      rightPaw.current.rotation.x = 0.35;
      return;
    }
    // Loop through pauses and two short scampering journeys.
    const cycle = clock.elapsedTime % 22;
    // Each phase chooses targets that the body will blend toward smoothly.
    let desiredPitch = squirrel.current.rotation.x;
    let desiredHeading = squirrel.current.rotation.y;
    // Run energy rises and falls around each burst instead of switching instantly.
    let runEnergy = 0;

    if (cycle < 4) {
      // Pause at the starting point and sniff with a small forward lean.
      squirrel.current.position.copy(SQUIRREL_START);
      squirrel.current.position.y += Math.abs(Math.sin(cycle * 2.2)) * 0.035;
      desiredPitch = 0.1 + Math.sin(cycle * 2.2) * 0.06;
      // Look around early, then face the route just before setting off.
      const scanAmount = 1 - THREE.MathUtils.smoothstep(cycle, 2.8, 4);
      desiredHeading =
        OUTBOUND_HEADING + Math.sin(cycle * 1.1) * 0.28 * scanAmount;
    } else if (cycle < 9) {
      // Accelerate smoothly toward cover on the far side of the path.
      const progress = (cycle - 4) / 5;
      const eased = THREE.MathUtils.smoothstep(progress, 0, 1);
      squirrel.current.position.lerpVectors(
        SQUIRREL_START,
        SQUIRREL_END,
        eased,
      );
      // Quick repeated bounds make the run read as a squirrel rather than a glide.
      squirrel.current.position.y +=
        Math.abs(Math.sin(progress * Math.PI * 9)) * 0.16;
      desiredPitch = -0.08;
      desiredHeading = OUTBOUND_HEADING;
      runEnergy = Math.sin(progress * Math.PI);
    } else if (cycle < 13) {
      // Sit upright at the far point and scan the garden before returning.
      squirrel.current.position.copy(SQUIRREL_END);
      squirrel.current.position.y += Math.sin(cycle * 2.5) * 0.018;
      desiredPitch = -0.12;
      // Turn during the pause and finish facing home before the return burst.
      const scanAmount = 1 - THREE.MathUtils.smoothstep(cycle, 11.8, 13);
      desiredHeading =
        RETURN_HEADING + Math.sin(cycle * 0.9) * 0.28 * scanAmount;
    } else if (cycle < 18) {
      // Follow the same bounding gait back toward the original patch.
      const progress = (cycle - 13) / 5;
      const eased = THREE.MathUtils.smoothstep(progress, 0, 1);
      squirrel.current.position.lerpVectors(
        SQUIRREL_END,
        SQUIRREL_START,
        eased,
      );
      squirrel.current.position.y +=
        Math.abs(Math.sin(progress * Math.PI * 9)) * 0.16;
      desiredPitch = -0.08;
      desiredHeading = RETURN_HEADING;
      runEnergy = Math.sin(progress * Math.PI);
    } else {
      // Settle at the starting point before the next foraging loop.
      squirrel.current.position.copy(SQUIRREL_START);
      desiredPitch = 0;
      // Turn back toward the foraging route while resting between loops.
      desiredHeading =
        OUTBOUND_HEADING +
        Math.sin(cycle) *
          0.18 *
          (1 - THREE.MathUtils.smoothstep(cycle, 20.8, 22));
    }

    // Blend body pitch so pausing and running never switch in a single frame.
    squirrel.current.rotation.x = THREE.MathUtils.damp(
      squirrel.current.rotation.x,
      desiredPitch,
      6,
      delta,
    );
    // Measure the shortest signed angle to avoid a sudden full-body spin.
    const headingDifference = Math.atan2(
      Math.sin(desiredHeading - squirrel.current.rotation.y),
      Math.cos(desiredHeading - squirrel.current.rotation.y),
    );
    // Turn gradually, including while preparing for the return journey.
    squirrel.current.rotation.y += headingDifference * Math.min(1, delta * 4.5);
    // Combine calm tail swishes with a faster balancing motion during a run.
    tail.current.rotation.z =
      -0.35 +
      Math.sin(clock.elapsedTime * 1.5) * 0.16 +
      Math.sin(clock.elapsedTime * 11) * 0.28 * runEnergy;
    // Alternate the forepaws rapidly during each running phase.
    const pawSwing = Math.sin(clock.elapsedTime * 15) * 0.55 * runEnergy;
    leftPaw.current.rotation.x = 0.35 + pawSwing;
    rightPaw.current.rotation.x = 0.35 - pawSwing;
  });

  // Render a recognizable squirrel silhouette with simple geometry.
  return (
    <group
      ref={squirrel}
      position={SQUIRREL_START.toArray()}
      rotation={[0, 0.75, 0]}
      scale={0.42}
    >
      {/* This volume includes the squirrel's body, head, and upright tail. */}
      <GardenInteractionTarget
        item={item}
        position={[0, 0.55, 0]}
        size={[2.6, 4, 3]}
        highlighted={highlighted}
      />
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
        ref={leftPaw}
        position={[-0.18, 0.08, 0.5]}
        rotation={[0.35, 0, -0.22]}
        scale={[0.13, 0.28, 0.12]}
      >
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#76543c" roughness={1} />
      </mesh>
      <mesh
        ref={rightPaw}
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
