// The squirrel's tail and body animate inside the render loop.
import { useFrame } from "@react-three/fiber";
// Refs retain the mutable Three.js groups between React renders.
import { useRef } from "react";
// Three provides the Group type used by the refs.
import * as THREE from "three";
// One shared target follows the squirrel without registering its many meshes.
import { GardenInteractionTarget } from "../../interaction/GardenInteractionTarget";
// The squirrel uses the identity and highlight shared by all animals.
import type { AnimatedAnimalProps } from "../animal-identities";
// Habitat data supplies Hazel's first foraging position.
import { ANIMAL_HABITATS, type HabitatPoint } from "../animal-habitats";
// A variable outer clock changes when Hazel decides to begin the full journey.
import {
  createAnimalRoutine,
  type AnimalRoutine,
} from "../behavior/animal-routine";
// Garden-wide destinations let each tree climb begin and end in different places.
import {
  createAnimalRoamingRoute,
  type AnimalRoamingRoute,
} from "../behavior/animal-roaming";
// The pure motion seam owns Hazel's complete ground and tree-climbing journey.
import { getSquirrelMotion, SQUIRREL_CYCLE_SECONDS } from "./squirrel-motion";

// This stable pose supplies both the initial render and reduced-motion fallback.
const SQUIRREL_REST_POSE = getSquirrelMotion(0);
// Preserve the safe climb sequence while varying its complete pace each cycle.
const SQUIRREL_ROUTINE = [
  { name: "journey", minDuration: 30, maxDuration: 48 },
] as const;
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
  // One seed coordinates changing journey lengths with changing foraging patches.
  const personalitySeed = useRef(Math.random() * 10_000).current;
  // Keep one visit-specific pace planner stable across interaction highlights.
  const routine = useRef<AnimalRoutine<"journey"> | null>(null);
  if (!routine.current) {
    routine.current = createAnimalRoutine(personalitySeed, SQUIRREL_ROUTINE);
  }
  // Capture the initialized planner for the frame callback.
  const behaviorRoutine = routine.current;
  // Cache each newly chosen garden patch so Hazel's route stays continuous.
  const roaming = useRef<AnimalRoamingRoute | null>(null);
  if (!roaming.current) {
    roaming.current = createAnimalRoamingRoute(
      personalitySeed,
      ANIMAL_HABITATS.squirrel.start,
    );
  }
  // Capture the initialized garden route for the animation callback.
  const roamingRoute = roaming.current;

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
      squirrel.current.position.set(...SQUIRREL_REST_POSE.position);
      squirrel.current.rotation.set(
        SQUIRREL_REST_POSE.pitch,
        SQUIRREL_REST_POSE.heading,
        0,
      );
      tail.current.rotation.z = -0.35;
      leftPaw.current.rotation.x = 0.35;
      rightPaw.current.rotation.x = 0.35;
      return;
    }
    // Stretch or compress the complete safe journey with a newly chosen duration.
    const behavior = behaviorRoutine.advance(delta);
    // End each tree visit at a new patch that becomes the next journey's beginning.
    const startPoint = roamingRoute.point(behavior.cycleIndex);
    const endPoint = roamingRoute.point(behavior.cycleIndex + 1);
    // Convert cached vectors into the immutable tuple interface used by motion tests.
    const groundStart: HabitatPoint = [
      startPoint.x,
      startPoint.y,
      startPoint.z,
    ];
    const groundEnd: HabitatPoint = [endPoint.x, endPoint.y, endPoint.z];
    // Ask the public motion seam for the equivalent point in its tested cycle.
    const pose = getSquirrelMotion(
      behavior.progress * SQUIRREL_CYCLE_SECONDS,
      groundStart,
      groundEnd,
    );
    // Place Hazel directly on the continuous ground, trunk, or branch path.
    squirrel.current.position.set(...pose.position);

    // Blend body pitch so pausing and running never switch in a single frame.
    squirrel.current.rotation.x = THREE.MathUtils.damp(
      squirrel.current.rotation.x,
      pose.pitch,
      6,
      delta,
    );
    // Measure the shortest signed angle to avoid a sudden full-body spin.
    const headingDifference = Math.atan2(
      Math.sin(pose.heading - squirrel.current.rotation.y),
      Math.cos(pose.heading - squirrel.current.rotation.y),
    );
    // Turn gradually while approaching, circling, perching, and returning.
    squirrel.current.rotation.y += headingDifference * Math.min(1, delta * 4.5);
    // Combine calm tail swishes with faster balance during runs and climbing.
    tail.current.rotation.z =
      -0.35 +
      Math.sin(clock.elapsedTime * 1.5) * 0.16 +
      Math.sin(clock.elapsedTime * 11) * 0.28 * pose.motionEnergy;
    // Alternate the forepaws rapidly during running, ascent, and descent.
    const pawSwing =
      Math.sin(clock.elapsedTime * 15) * 0.55 * pose.motionEnergy;
    leftPaw.current.rotation.x = 0.35 + pawSwing;
    rightPaw.current.rotation.x = 0.35 - pawSwing;
  });

  // Render a recognizable squirrel silhouette with simple geometry.
  return (
    <group
      ref={squirrel}
      position={SQUIRREL_REST_POSE.position}
      rotation={[SQUIRREL_REST_POSE.pitch, SQUIRREL_REST_POSE.heading, 0]}
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
