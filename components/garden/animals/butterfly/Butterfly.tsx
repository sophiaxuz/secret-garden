// The render-loop hook lets the butterfly move and flap continuously.
import { useFrame } from "@react-three/fiber";
// Refs give animation code direct access to Three.js groups.
import { useRef } from "react";
// Three provides the Group type and double-sided material constant.
import * as THREE from "three";
// One shared target follows the butterfly without raycasting each visible wing.
import { GardenInteractionTarget } from "../../interaction/GardenInteractionTarget";
// The shared point type gives butterfly origins the same habitat vocabulary as animals.
import type { HabitatPoint } from "../animal-habitats";
// Variable flight durations keep arrivals from following a visible metronome.
import {
  createAnimalRoutine,
  type AnimalRoutine,
} from "../behavior/animal-routine";
// The shared flight-rest journey prevents unsupported sleep and dawn teleporting.
import {
  createFlyingSleepJourney,
  type FlyingSleepJourney,
} from "../behavior/animal-sleep";
// The roaming planner lets a butterfly cross the full garden rather than orbit one flower.
import {
  createAnimalRoamingRoute,
  placeAlongRoamingJourney,
  type AnimalRoamingRoute,
} from "../behavior/animal-roaming";
// Butterfly props extend the identity and highlight shared by all animals.
import type { AnimatedAnimalProps } from "../animal-identities";

// These values make each butterfly follow a different route and color palette.
type ButterflyProps = AnimatedAnimalProps & {
  color: string;
  origin: HabitatPoint;
  phase?: number;
};

// One unhurried flight phase selects a fresh destination every time it completes.
const BUTTERFLY_ROUTINE = [
  { name: "flying", minDuration: 18, maxDuration: 32 },
] as const;

// Build a lightweight butterfly from a body and four moving wings.
export function Butterfly({
  animated = true,
  sleeping = false,
  color,
  origin,
  phase = 0,
  item,
  highlighted = false,
}: ButterflyProps) {
  // This ref moves the whole butterfly through the garden.
  const butterfly = useRef<THREE.Group>(null);
  // This journey remembers the paused flight point until dawn returns to it.
  const sleepJourney = useRef<FlyingSleepJourney | null>(null);
  if (!sleepJourney.current) {
    // Create once so rerenders never forget a night transition in progress.
    sleepJourney.current = createFlyingSleepJourney();
  }
  // Lower the authored flight origin into dense vegetation for supported rest.
  const roost = useRef<HabitatPoint>([
    origin[0],
    Math.min(origin[1], 0.62),
    origin[2],
  ]).current;
  // These refs animate the left and right wing pairs independently.
  const leftWing = useRef<THREE.Group>(null);
  const rightWing = useRef<THREE.Group>(null);
  // Combine the authored phase with randomness so the three butterflies remain distinct.
  const personalitySeed = useRef(Math.random() * 10_000 + phase * 997).current;
  // The routine controls how long each cross-garden flight lasts.
  const routine = useRef<AnimalRoutine<"flying"> | null>(null);
  if (!routine.current) {
    routine.current = createAnimalRoutine(personalitySeed, BUTTERFLY_ROUTINE);
  }
  // Capture the initialized routine for the render loop.
  const behaviorRoutine = routine.current;
  // Cache garden-wide destinations so a butterfly commits to each chosen flower patch.
  const roaming = useRef<AnimalRoamingRoute | null>(null);
  if (!roaming.current) {
    roaming.current = createAnimalRoamingRoute(personalitySeed, origin);
  }
  // Capture the initialized route for the render loop.
  const roamingRoute = roaming.current;

  // Update position, orientation, and wing angle before every frame.
  useFrame(({ clock }, delta) => {
    // Stop until React has connected all refs to Three.js objects.
    if (!butterfly.current || !leftWing.current || !rightWing.current) return;
    // Let the tested lifecycle decide between flight, rest, and waking return.
    const sleepDecision = sleepJourney.current!.update(
      sleeping,
      [
        butterfly.current.position.x,
        butterfly.current.position.y,
        butterfly.current.position.z,
      ],
      roost,
    );
    // Travel awake to the roost at night and back to the paused route at dawn.
    if (
      sleepDecision.phase === "settling" ||
      sleepDecision.phase === "waking"
    ) {
      // Reduced motion completes the positional transition in effectively one frame.
      const travelDelta = animated ? delta : 10;
      // Both transition phases always provide the tested destination they require.
      const target = sleepDecision.target!;
      // Damp each world axis so the small flyer never teleports between points.
      butterfly.current.position.x = THREE.MathUtils.damp(
        butterfly.current.position.x,
        target[0],
        1.15,
        travelDelta,
      );
      butterfly.current.position.y = THREE.MathUtils.damp(
        butterfly.current.position.y,
        target[1],
        1.15,
        travelDelta,
      );
      butterfly.current.position.z = THREE.MathUtils.damp(
        butterfly.current.position.z,
        target[2],
        1.15,
        travelDelta,
      );
      // Face the destination while open wings retain an unmistakable flight pose.
      butterfly.current.rotation.x = THREE.MathUtils.damp(
        butterfly.current.rotation.x,
        0,
        4,
        travelDelta,
      );
      butterfly.current.rotation.y = Math.atan2(
        target[0] - butterfly.current.position.x,
        target[2] - butterfly.current.position.z,
      );
      // Reduced motion uses open still wings; ordinary mode continues flapping.
      const flap = animated
        ? Math.sin(clock.elapsedTime * 10 + phase) * 0.65
        : 0;
      leftWing.current.rotation.y = flap;
      rightWing.current.rotation.y = -flap;
      return;
    }
    // Only a butterfly already supported by its roost may fold into sleep.
    if (sleepDecision.phase === "sleeping") {
      // Reduced motion completes this one-time settling pose without a glide.
      const restDelta = animated ? delta : 10;
      // Pin the final centimetres to the roost so sleep cannot visibly drift.
      butterfly.current.position.set(...roost);
      // Tip the body toward a stem and close both wing pairs nearly together.
      butterfly.current.rotation.x = THREE.MathUtils.damp(
        butterfly.current.rotation.x,
        0.38,
        3,
        restDelta,
      );
      butterfly.current.rotation.y = phase * 0.37;
      leftWing.current.rotation.y = THREE.MathUtils.damp(
        leftWing.current.rotation.y,
        1.42,
        4,
        restDelta,
      );
      rightWing.current.rotation.y = THREE.MathUtils.damp(
        rightWing.current.rotation.y,
        -1.42,
        4,
        restDelta,
      );
      return;
    }
    // Keep each butterfly calmly resting at its own origin for reduced motion.
    if (!animated) {
      butterfly.current.position.set(origin[0], origin[1], origin[2]);
      butterfly.current.rotation.set(0, 0, 0);
      leftWing.current.rotation.y = 0;
      rightWing.current.rotation.y = 0;
      return;
    }
    // Reopen the body angle smoothly when the first dawn flight begins.
    butterfly.current.rotation.x = THREE.MathUtils.damp(
      butterfly.current.rotation.x,
      0,
      3,
      delta,
    );
    // Advance one variable-duration flight toward the next distant destination.
    const behavior = behaviorRoutine.advance(delta);
    // Each completed flight continues from its old endpoint to a fresh route point.
    const from = roamingRoute.point(behavior.cycleIndex);
    const to = roamingRoute.point(behavior.cycleIndex + 1);
    // Bow the route sideways so long flights never look ruler-straight.
    placeAlongRoamingJourney(
      butterfly.current.position,
      from,
      to,
      behavior.progress,
      behavior.variation * 3.2,
    );
    // Rise above grass during travel and settle lower near each destination.
    butterfly.current.position.y +=
      Math.sin(behavior.progress * Math.PI) *
        (0.8 + Math.abs(behavior.variation) * 1.2) +
      Math.sin(clock.elapsedTime * 2.1 + phase) * 0.16;
    // Face the broad destination while small oscillations suggest searching flight.
    butterfly.current.rotation.y =
      roamingRoute.heading(behavior.cycleIndex, behavior.cycleIndex + 1) +
      Math.sin(clock.elapsedTime * 0.9 + phase) * 0.2;
    // Oscillate both wings in opposite directions to create flapping.
    const flap = Math.sin(clock.elapsedTime * 10 + phase) * 0.65;
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
      {/* A generous hidden volume makes the small moving butterfly selectable. */}
      <GardenInteractionTarget
        item={item}
        position={[0, 0.1, 0]}
        size={[4, 4, 4]}
        highlighted={highlighted}
      />
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
