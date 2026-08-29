// The render-loop hook lets the rabbit behave without React rerenders.
import { useFrame } from "@react-three/fiber";
// Refs expose the rabbit's moving parts to the animation function.
import { useRef } from "react";
// Three supplies vectors, groups, and smooth interpolation helpers.
import * as THREE from "three";
// One shared target follows the rabbit without entering its visible model.
import { GardenInteractionTarget } from "../../interaction/GardenInteractionTarget";
// Shared habitat data supplies the rabbit's first position when a visit begins.
import { ANIMAL_HABITATS, createHabitatVector } from "../animal-habitats";
// The shared planner varies pauses and attention choices across every visit.
import {
  createAnimalRoutine,
  type AnimalRoutine,
} from "../behavior/animal-routine";
// Garden-wide roaming lets the rabbit choose fresh feeding patches continuously.
import {
  createAnimalRoamingRoute,
  placeAlongRoamingJourney,
  type AnimalRoamingRoute,
} from "../behavior/animal-roaming";
// The rabbit uses the identity and highlight shared by all animals.
import type { AnimatedAnimalProps } from "../animal-identities";
// RabbitModel keeps all visible mesh geometry out of this behavior module.
import { RabbitModel, type RabbitRig } from "./RabbitModel";

// The authored sunny habitat remains the rabbit's first rendered feeding patch.
const RABBIT_HOME = createHabitatVector(ANIMAL_HABITATS.rabbit.start);

// Long journeys and wide listening ranges balance calmness with sudden bounds.
const RABBIT_ROUTINE = [
  { name: "nibbling", minDuration: 4, maxDuration: 10 },
  { name: "bounding", minDuration: 10, maxDuration: 18 },
  { name: "listening", minDuration: 4, maxDuration: 11 },
  { name: "darting", minDuration: 10, maxDuration: 18 },
] as const;
// Derive valid names directly from the species schedule.
type RabbitRoutineName = (typeof RABBIT_ROUTINE)[number]["name"];

// Build a little garden rabbit that nibbles, listens, and bounds through grass.
export function Rabbit({
  animated = true,
  sleeping = false,
  item,
  highlighted = false,
}: AnimatedAnimalProps) {
  // This group moves the complete rabbit along its route.
  const rabbit = useRef<THREE.Group>(null);
  // The head dips independently when the rabbit eats.
  const head = useRef<THREE.Group>(null);
  // Ear refs create separate alert twitches.
  const leftEar = useRef<THREE.Mesh>(null);
  const rightEar = useRef<THREE.Mesh>(null);
  // One personality seed coordinates the rabbit's timing and roaming choices.
  const personalitySeed = useRef(Math.random() * 10_000).current;
  // Keep a visit-specific personality without rerendering on every decision.
  const routine = useRef<AnimalRoutine<RabbitRoutineName> | null>(null);
  if (!routine.current) {
    routine.current = createAnimalRoutine(personalitySeed, RABBIT_ROUTINE);
  }
  // Capture the initialized planner so the frame callback sees a non-null routine.
  const behaviorRoutine = routine.current;
  // Cache every selected feeding patch so a running rabbit never changes course.
  const roaming = useRef<AnimalRoamingRoute | null>(null);
  if (!roaming.current) {
    roaming.current = createAnimalRoamingRoute(
      personalitySeed,
      ANIMAL_HABITATS.rabbit.start,
    );
  }
  // Capture the initialized route for use inside the animation callback.
  const roamingRoute = roaming.current;
  // Package the model's internal attachment points behind one private interface.
  const rig: RabbitRig = { head, leftEar, rightEar };

  // Continue foraging, listening, and bounding across the complete garden.
  useFrame(({ clock }, delta) => {
    // Wait until React has attached every moving scene object.
    if (
      !rabbit.current ||
      !head.current ||
      !leftEar.current ||
      !rightEar.current
    )
      return;
    // Night returns Clover to a low, tucked sleeping posture in the grass.
    if (sleeping) {
      // Reduced motion reaches the still crouch immediately and skips breathing.
      const restDelta = animated ? delta : 10;
      // Ease back to the familiar feeding patch without a visible teleport.
      rabbit.current.position.lerp(
        RABBIT_HOME,
        1 - Math.exp(-restDelta * 0.72),
      );
      // Keep the body low and still while the face rests against the forepaws.
      rabbit.current.rotation.x = THREE.MathUtils.damp(
        rabbit.current.rotation.x,
        0.1,
        4,
        restDelta,
      );
      rabbit.current.rotation.y = THREE.MathUtils.damp(
        rabbit.current.rotation.y,
        -0.3,
        2,
        restDelta,
      );
      rabbit.current.rotation.z = 0;
      // Slow breathing moves only the tucked head by a few millimetres.
      head.current.rotation.x =
        0.48 + (animated ? Math.sin(clock.elapsedTime * 1.08) * 0.018 : 0);
      // Lay both long ears back so the silhouette no longer reads as alert.
      leftEar.current.rotation.x = THREE.MathUtils.damp(
        leftEar.current.rotation.x,
        1.05,
        4,
        restDelta,
      );
      rightEar.current.rotation.x = THREE.MathUtils.damp(
        rightEar.current.rotation.x,
        1.0,
        4,
        restDelta,
      );
      leftEar.current.rotation.z = 0.16;
      rightEar.current.rotation.z = -0.16;
      return;
    }
    // Use a calm grounded pose when reduced motion is requested.
    if (!animated) {
      rabbit.current.position.copy(RABBIT_HOME);
      rabbit.current.rotation.set(0, 0, 0);
      head.current.rotation.set(0.12, 0, 0);
      leftEar.current.rotation.set(0.08, 0, 0.08);
      rightEar.current.rotation.set(-0.04, 0, -0.08);
      return;
    }

    // Raise both ears and level the body as dawn restarts the foraging routine.
    rabbit.current.rotation.z = THREE.MathUtils.damp(
      rabbit.current.rotation.z,
      0,
      4,
      delta,
    );
    leftEar.current.rotation.x = THREE.MathUtils.damp(
      leftEar.current.rotation.x,
      0.08,
      4,
      delta,
    );
    rightEar.current.rotation.x = THREE.MathUtils.damp(
      rightEar.current.rotation.x,
      -0.04,
      4,
      delta,
    );

    // Advance one variable-duration phase while preserving frame-rate independence.
    const behavior = behaviorRoutine.advance(delta);
    const phaseTime = behavior.phaseTime;
    // Every completed cycle advances to two new connected feeding patches.
    const firstIndex = behavior.cycleIndex * 2;
    const middleIndex = firstIndex + 1;
    const finalIndex = firstIndex + 2;
    // Stable cached destinations prevent any mid-bound directional jumps.
    const firstPoint = roamingRoute.point(firstIndex);
    const middlePoint = roamingRoute.point(middleIndex);
    const finalPoint = roamingRoute.point(finalIndex);
    // Begin with the current pose and let each phase choose new targets.
    let desiredHeading = rabbit.current.rotation.y;
    let desiredHeadPitch = head.current.rotation.x;
    let boundEnergy = 0;

    if (behavior.phase === "nibbling") {
      // Stay at the last reached patch while making small nibbling movements.
      rabbit.current.position.copy(firstPoint);
      rabbit.current.position.y += Math.sin(phaseTime * 2.4) * 0.012;
      desiredHeading = roamingRoute.heading(firstIndex, middleIndex);
      desiredHeadPitch =
        0.2 +
        Math.abs(Math.sin(phaseTime * (2.6 + behavior.variation * 0.35))) * 0.2;
    } else if (behavior.phase === "bounding") {
      // Bound toward a newly selected patch anywhere across the garden.
      const progress = behavior.progress;
      placeAlongRoamingJourney(
        rabbit.current.position,
        firstPoint,
        middlePoint,
        progress,
        behavior.variation * 1.25,
      );
      // Repeat compact bounds at a natural cadence throughout the slower journey.
      rabbit.current.position.y +=
        Math.abs(Math.sin(phaseTime * 3.8)) *
        Math.sin(progress * Math.PI) *
        0.24;
      desiredHeading = roamingRoute.heading(firstIndex, middleIndex);
      desiredHeadPitch = -0.08;
      boundEnergy = Math.sin(progress * Math.PI);
    } else if (behavior.phase === "listening") {
      // Sit at the far patch and scan for sounds before returning.
      rabbit.current.position.copy(middlePoint);
      rabbit.current.position.y += Math.sin(phaseTime * 2) * 0.01;
      desiredHeading =
        roamingRoute.heading(middleIndex, finalIndex) +
        Math.sin(phaseTime * 0.85) * 0.22 +
        behavior.variation * 0.22;
      desiredHeadPitch = -0.05;
    } else {
      // Dart onward to another fresh patch instead of returning home.
      const progress = behavior.progress;
      placeAlongRoamingJourney(
        rabbit.current.position,
        middlePoint,
        finalPoint,
        progress,
        behavior.variation * 1.25,
      );
      rabbit.current.position.y +=
        Math.abs(Math.sin(phaseTime * 3.8)) *
        Math.sin(progress * Math.PI) *
        0.24;
      desiredHeading = roamingRoute.heading(middleIndex, finalIndex);
      desiredHeadPitch = -0.08;
      boundEnergy = Math.sin(progress * Math.PI);
    }

    // Find the shortest signed turn between the current and desired headings.
    const headingDifference = Math.atan2(
      Math.sin(desiredHeading - rabbit.current.rotation.y),
      Math.cos(desiredHeading - rabbit.current.rotation.y),
    );
    // Turn gently so the rabbit never snaps between route directions.
    rabbit.current.rotation.y += headingDifference * Math.min(1, delta * 4.5);
    // Tilt forward slightly through the middle of each bounding run.
    rabbit.current.rotation.x = THREE.MathUtils.damp(
      rabbit.current.rotation.x,
      -0.1 * boundEnergy,
      7,
      delta,
    );
    // Blend the head between eating, listening, and running poses.
    head.current.rotation.x = THREE.MathUtils.damp(
      head.current.rotation.x,
      desiredHeadPitch,
      8,
      delta,
    );
    // Twitch each ear at a different rhythm to keep the pose asymmetrical.
    leftEar.current.rotation.z =
      0.08 + Math.sin(clock.elapsedTime * 2.4) * 0.055;
    rightEar.current.rotation.z =
      -0.08 + Math.sin(clock.elapsedTime * 1.9 + 1.2) * 0.045;
  });

  // Keep the root transform with behavior while delegating visible geometry.
  return (
    <group
      ref={rabbit}
      position={RABBIT_HOME.toArray()}
      rotation={[0, 0, 0]}
      scale={0.55}
    >
      {/* This volume follows the crouched or bounding rabbit everywhere it roams. */}
      <GardenInteractionTarget
        item={item}
        position={[0, 0.3, 0]}
        size={[2.5, 2.8, 3]}
        highlighted={highlighted}
      />
      <RabbitModel rig={rig} sleeping={sleeping} />
    </group>
  );
}
