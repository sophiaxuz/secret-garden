// The robin uses the shared render loop for hopping and flight.
import { useFrame } from "@react-three/fiber";
// Refs expose the bird and its moving parts to animation code.
import { useRef } from "react";
// Three provides group types, interpolation helpers, and vectors.
import * as THREE from "three";
// One shared target follows the robin through hopping and flight phases.
import { GardenInteractionTarget } from "../interaction/GardenInteractionTarget";
// Shared habitat data keeps the robin's ground route and perch easy to relocate.
import { ANIMAL_HABITATS, createHabitatVector } from "./animal-habitats";
// The shared planner varies hops, perch pauses, and attention across each visit.
import { createAnimalRoutine, type AnimalRoutine } from "./animal-routine";
// The robin uses the same identity and highlight interface as every animal.
import type { AnimatedAnimalProps } from "./animal-identities";

// Reuse route endpoints rather than allocating new vectors every frame.
const GROUND_START = createHabitatVector(ANIMAL_HABITATS.robin.groundStart);
const GROUND_END = createHabitatVector(ANIMAL_HABITATS.robin.groundEnd);
const PERCH = createHabitatVector(ANIMAL_HABITATS.robin.perch);

// The wide perch range makes each sudden takeoff difficult to anticipate exactly.
const ROBIN_ROUTINE = [
  { name: "hopping", minDuration: 3, maxDuration: 7 },
  { name: "flyingUp", minDuration: 2.2, maxDuration: 3.8 },
  { name: "perching", minDuration: 2.5, maxDuration: 10 },
  { name: "flyingDown", minDuration: 2.2, maxDuration: 3.8 },
  { name: "watching", minDuration: 1.5, maxDuration: 6 },
] as const;
// Derive the valid routine vocabulary from the authored phases.
type RobinRoutineName = (typeof ROBIN_ROUTINE)[number]["name"];

// Copy an interpolated position and add a curved flight arc.
function flyBetween(
  bird: THREE.Group,
  start: THREE.Vector3,
  end: THREE.Vector3,
  progress: number,
): number {
  // Smoothstep prevents abrupt acceleration at takeoff and landing.
  const eased = THREE.MathUtils.smoothstep(progress, 0, 1);
  // Interpolate each world coordinate between the route endpoints.
  bird.position.lerpVectors(start, end, eased);
  // A sine arc raises the bird between its two endpoints.
  bird.position.y += Math.sin(progress * Math.PI) * 0.65;
  // Return the travel direction so the caller can turn toward it gradually.
  return Math.atan2(end.x - start.x, end.z - start.z);
}

// Build a stylized European robin with a repeating natural behavior cycle.
export function Robin({
  animated = true,
  item,
  highlighted = false,
}: AnimatedAnimalProps) {
  // This group moves the complete bird through the garden.
  const robin = useRef<THREE.Group>(null);
  // The head turns independently while the robin watches its surroundings.
  const head = useRef<THREE.Group>(null);
  // Wing groups unfold and flap during the flight phases.
  const leftWing = useRef<THREE.Group>(null);
  const rightWing = useRef<THREE.Group>(null);
  // A visit-specific personality prevents the robin replaying one fixed film.
  const routine = useRef<AnimalRoutine<RobinRoutineName> | null>(null);
  if (!routine.current) {
    routine.current = createAnimalRoutine(
      Math.random() * 10_000,
      ROBIN_ROUTINE,
    );
  }
  // Capture the initialized planner for the frame callback.
  const behaviorRoutine = routine.current;

  // Run an open-ended hop, fly, perch, and return routine.
  useFrame(({ clock }, delta) => {
    // Wait until every animated group exists in the scene.
    if (
      !robin.current ||
      !head.current ||
      !leftWing.current ||
      !rightWing.current
    )
      return;
    // Return to a grounded resting pose if reduced motion is enabled live.
    if (!animated) {
      robin.current.position.copy(GROUND_START);
      robin.current.rotation.set(0, 0.2, 0);
      head.current.rotation.y = 0;
      leftWing.current.rotation.z = 0.43;
      rightWing.current.rotation.z = -0.43;
      return;
    }
    // Advance the robin's current variable-duration decision.
    const behavior = behaviorRoutine.advance(delta);
    const phaseTime = behavior.phaseTime;
    // Track whether wings should be visibly flapping this frame.
    const flying =
      behavior.phase === "flyingUp" || behavior.phase === "flyingDown";
    // Begin with the current heading so each behavioral phase can choose a target.
    let desiredHeading = robin.current.rotation.y;
    // Ease wing effort in after takeoff and out before landing.
    let flightEffort = 0;

    if (behavior.phase === "hopping") {
      // Choose between three and six hops for this particular ground crossing.
      const hopCount = 3 + Math.floor((behavior.variation + 1) * 1.75);
      const scaledHops = behavior.progress * hopCount;
      const hopProgress = scaledHops % 1;
      const routeProgress = behavior.progress;
      // Move forward steadily while the sine curve lifts each hop.
      robin.current.position.lerpVectors(
        GROUND_START,
        GROUND_END,
        routeProgress,
      );
      robin.current.position.y += Math.sin(hopProgress * Math.PI) * 0.22;
      desiredHeading = Math.atan2(
        GROUND_END.x - GROUND_START.x,
        GROUND_END.z - GROUND_START.z,
      );
    } else if (behavior.phase === "flyingUp") {
      // Take a short arcing flight from the path to a low perch.
      const progress = behavior.progress;
      desiredHeading = flyBetween(robin.current, GROUND_END, PERCH, progress);
      flightEffort = Math.sin(progress * Math.PI);
    } else if (behavior.phase === "perching") {
      // Rest on the perch with small breathing motion.
      robin.current.position.copy(PERCH);
      robin.current.position.y += Math.sin(phaseTime * 2.4) * 0.018;
      desiredHeading =
        -1.15 + Math.sin(phaseTime * 0.8) * 0.18 + behavior.variation * 0.24;
    } else if (behavior.phase === "flyingDown") {
      // Fly back toward the path along the reverse arc.
      const progress = behavior.progress;
      desiredHeading = flyBetween(robin.current, PERCH, GROUND_START, progress);
      flightEffort = Math.sin(progress * Math.PI);
    } else {
      // Pause on the path and look around before hopping again.
      robin.current.position.copy(GROUND_START);
      robin.current.position.y += Math.sin(phaseTime * 2.2) * 0.012;
      desiredHeading =
        0.2 + Math.sin(phaseTime * 1.1) * 0.35 + behavior.variation * 0.2;
    }

    // Measure the shortest signed angle so turns never spin the long way around.
    const headingDifference = Math.atan2(
      Math.sin(desiredHeading - robin.current.rotation.y),
      Math.cos(desiredHeading - robin.current.rotation.y),
    );
    // Blend toward the target direction instead of snapping between phases.
    robin.current.rotation.y += headingDifference * Math.min(1, delta * 4.5);
    // Turn the head more quickly than the body to create alert bird behavior.
    head.current.rotation.y =
      Math.sin(phaseTime * 2.1) * 0.32 + behavior.variation * 0.12;
    // Fold wings against the body on the ground and open them in flight.
    const flap = flying
      ? 0.08 + Math.sin(clock.elapsedTime * 18) * 0.85 * flightEffort
      : 0.08;
    leftWing.current.rotation.z = 0.35 + flap;
    rightWing.current.rotation.z = -0.35 - flap;
  });

  // Render the robin from lightweight rounded primitives.
  return (
    <>
      {/* Give the flight route a physical destination instead of an invisible perch. */}
      <group position={[PERCH.x, 0, PERCH.z]}>
        {/* A slender weathered stem supports the low horizontal branch. */}
        <mesh position={[0, 0.74, 0]}>
          <cylinderGeometry args={[0.085, 0.14, 1.48, 8]} />
          <meshStandardMaterial color="#54412d" roughness={1} />
        </mesh>
        {/* The robin's feet land on this branch at the end of the flight arc. */}
        <mesh position={[-0.22, 1.48, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.065, 0.09, 0.86, 8]} />
          <meshStandardMaterial color="#624a32" roughness={1} />
        </mesh>
        {/* A short angled twig keeps the perch from looking manufactured. */}
        <mesh position={[-0.5, 1.68, 0]} rotation={[0, 0, -0.55]}>
          <cylinderGeometry args={[0.028, 0.045, 0.48, 7]} />
          <meshStandardMaterial color="#624a32" roughness={1} />
        </mesh>
      </group>
      {/* This group holds and moves every visible part of the robin. */}
      <group ref={robin} position={GROUND_START.toArray()} scale={0.34}>
        {/* This box follows both the robin's ground route and curved flights. */}
        <GardenInteractionTarget
          item={item}
          position={[0, 0.1, 0]}
          size={[2.4, 3, 2.4]}
          highlighted={highlighted}
        />
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
        {/* The left wing hinges outward during flight. */}
        <group
          ref={leftWing}
          position={[-0.38, 0.02, -0.02]}
          rotation={[0, 0, 0.43]}
        >
          <mesh scale={[0.18, 0.65, 0.42]}>
            <sphereGeometry args={[0.7, 12, 8]} />
            <meshStandardMaterial color="#594033" roughness={1} />
          </mesh>
        </group>
        {/* The right wing mirrors the left wing. */}
        <group
          ref={rightWing}
          position={[0.38, 0.02, -0.02]}
          rotation={[0, 0, -0.43]}
        >
          <mesh scale={[0.18, 0.65, 0.42]}>
            <sphereGeometry args={[0.7, 12, 8]} />
            <meshStandardMaterial color="#594033" roughness={1} />
          </mesh>
        </group>
        {/* Group the head, eyes, and beak so they turn together. */}
        <group ref={head} position={[0, 0.58, 0.08]}>
          <mesh>
            <sphereGeometry args={[0.38, 18, 12]} />
            <meshStandardMaterial color="#574237" roughness={0.95} />
          </mesh>
          <mesh position={[-0.2, 0.1, 0.27]}>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshBasicMaterial color="#0e1110" />
          </mesh>
          <mesh position={[0.2, 0.1, 0.27]}>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshBasicMaterial color="#0e1110" />
          </mesh>
          <mesh position={[0, -0.01, 0.41]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.08, 0.28, 8]} />
            <meshStandardMaterial color="#26231d" roughness={0.9} />
          </mesh>
        </group>
        {/* Two simple legs make ground hops visually connect with the path. */}
        <mesh position={[-0.15, -0.55, 0.08]}>
          <cylinderGeometry args={[0.025, 0.025, 0.32, 6]} />
          <meshStandardMaterial color="#34291f" roughness={1} />
        </mesh>
        <mesh position={[0.15, -0.55, 0.08]}>
          <cylinderGeometry args={[0.025, 0.025, 0.32, 6]} />
          <meshStandardMaterial color="#34291f" roughness={1} />
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
    </>
  );
}
