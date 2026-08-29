// The render-loop hook gives the cat continuous, quiet movement.
import { useFrame } from "@react-three/fiber";
// Refs expose the cat's head, tail, and paws to animation code.
import { useRef } from "react";
// Three provides vectors and interpolation helpers for the patrol route.
import * as THREE from "three";
// One shared target follows the cat without entering its visible model.
import { GardenInteractionTarget } from "../../interaction/GardenInteractionTarget";
// Shared habitat data supplies the cat's first position when a visit begins.
import { ANIMAL_HABITATS, createHabitatVector } from "../animal-habitats";
// The shared planner varies pauses and attention choices across every visit.
import {
  createAnimalRoutine,
  type AnimalRoutine,
} from "../behavior/animal-routine";
// The shared night anchor holds Mallow in place and releases her route at dawn.
import {
  getAnimalSleepAnchor,
  type AnimalSleepAnchor,
} from "../behavior/animal-sleep";
// Garden-wide roaming lets the cat choose distant places beyond its old patrol.
import {
  createAnimalRoamingRoute,
  placeAlongRoamingJourney,
  type AnimalRoamingRoute,
} from "../behavior/animal-roaming";
// The cat uses the identity and highlight shared by all animals.
import type { AnimatedAnimalProps } from "../animal-identities";
// CatModel keeps all visible mesh geometry out of this behavior module.
import { CatModel, type CatRig } from "./CatModel";

// The original deep habitat remains the cat's first rendered resting place.
const CAT_HOME = createHabitatVector(ANIMAL_HABITATS.cat.start);

// A cat may watch for a long time, then unexpectedly decide to prowl.
const CAT_ROUTINE = [
  { name: "watching", minDuration: 5, maxDuration: 13 },
  { name: "prowling", minDuration: 17, maxDuration: 28 },
  { name: "sitting", minDuration: 5, maxDuration: 14 },
  { name: "wandering", minDuration: 17, maxDuration: 28 },
  { name: "settling", minDuration: 3, maxDuration: 7 },
] as const;
// Derive valid names directly from the schedule authoring data.
type CatRoutineName = (typeof CAT_ROUTINE)[number]["name"];

// Build a grey tabby that watches, prowls, pauses, and wanders onward.
export function Cat({
  animated = true,
  sleeping = false,
  item,
  highlighted = false,
}: AnimatedAnimalProps) {
  // The root group controls the complete cat's world transform.
  const cat = useRef<THREE.Group>(null);
  // This tuple captures the exact daytime position where night begins.
  const sleepAnchor = useRef<AnimalSleepAnchor>(null);
  // The upper body lifts independently when the cat settles into a sit.
  const body = useRef<THREE.Group>(null);
  // The head turns independently as the cat tracks garden movement.
  const head = useRef<THREE.Group>(null);
  // Two tail sections create a soft curved swish.
  const tail = useRef<THREE.Group>(null);
  const tailTip = useRef<THREE.Group>(null);
  // Front paws alternate subtly while the cat prowls.
  const leftPaw = useRef<THREE.Mesh>(null);
  const rightPaw = useRef<THREE.Mesh>(null);
  // Hind-leg refs fold for sitting and join the walking gait.
  const leftHindLeg = useRef<THREE.Mesh>(null);
  const rightHindLeg = useRef<THREE.Mesh>(null);
  // One seed gives this visit a coherent timing and destination personality.
  const personalitySeed = useRef(Math.random() * 10_000).current;
  // Keep one random personality stable throughout this mounted garden visit.
  const routine = useRef<AnimalRoutine<CatRoutineName> | null>(null);
  if (!routine.current) {
    routine.current = createAnimalRoutine(personalitySeed, CAT_ROUTINE);
  }
  // Capture the initialized planner so the frame callback sees a non-null routine.
  const behaviorRoutine = routine.current;
  // Route choices remain cached so the cat never changes destination mid-stalk.
  const roaming = useRef<AnimalRoamingRoute | null>(null);
  if (!roaming.current) {
    roaming.current = createAnimalRoamingRoute(
      personalitySeed,
      ANIMAL_HABITATS.cat.start,
    );
  }
  // Capture the initialized route for use inside the animation callback.
  const roamingRoute = roaming.current;
  // Package the model's internal attachment points behind one private interface.
  const rig: CatRig = {
    body,
    head,
    tail,
    tailTip,
    leftPaw,
    rightPaw,
    leftHindLeg,
    rightHindLeg,
  };

  // Continue watching, prowling, and choosing new garden destinations.
  useFrame(({ clock }, delta) => {
    // Stop until each animated part has mounted in the scene.
    if (
      !cat.current ||
      !body.current ||
      !head.current ||
      !tail.current ||
      !tailTip.current ||
      !leftPaw.current ||
      !rightPaw.current ||
      !leftHindLeg.current ||
      !rightHindLeg.current
    )
      return;
    // Capture or release the stable position before choosing a visible pose.
    sleepAnchor.current = getAnimalSleepAnchor(sleepAnchor.current, sleeping, [
      cat.current.position.x,
      cat.current.position.y,
      cat.current.position.z,
    ]);
    // Night folds Mallow into a compact curl wherever she safely stopped.
    if (sleeping) {
      // Reduced motion reaches the still curled pose immediately without breathing.
      const restDelta = animated ? delta : 10;
      // Hold the exact route position so Mallow curls up without sliding away.
      cat.current.position.set(...sleepAnchor.current!);
      // Keep the root grounded while the internal body performs the curl.
      cat.current.rotation.x = THREE.MathUtils.damp(
        cat.current.rotation.x,
        0.04,
        4,
        restDelta,
      );
      cat.current.rotation.y = THREE.MathUtils.damp(
        cat.current.rotation.y,
        0.7,
        2,
        restDelta,
      );
      cat.current.rotation.z = THREE.MathUtils.damp(
        cat.current.rotation.z,
        0.12,
        4,
        restDelta,
      );
      // Lower and round the torso with a tiny breathing movement.
      body.current.position.y =
        -0.08 + (animated ? Math.sin(clock.elapsedTime * 1.05) * 0.012 : 0);
      body.current.rotation.x = THREE.MathUtils.damp(
        body.current.rotation.x,
        -0.58,
        4,
        restDelta,
      );
      // Tuck the chin toward the chest and stop daytime scanning.
      head.current.rotation.x = THREE.MathUtils.damp(
        head.current.rotation.x,
        0.36,
        4,
        restDelta,
      );
      head.current.rotation.y = 0;
      // Wrap both tail sections around the sleeping body.
      tail.current.rotation.z = THREE.MathUtils.damp(
        tail.current.rotation.z,
        1.08,
        4,
        restDelta,
      );
      tailTip.current.rotation.z = THREE.MathUtils.damp(
        tailTip.current.rotation.z,
        1.02,
        4,
        restDelta,
      );
      // Fold all four paws rather than leaving a standing silhouette.
      leftPaw.current.rotation.x = 1.08;
      rightPaw.current.rotation.x = 1.08;
      leftHindLeg.current.rotation.x = 1.2;
      rightHindLeg.current.rotation.x = 1.2;
      return;
    }
    // Return to a composed standing pose when motion should be reduced.
    if (!animated) {
      cat.current.position.copy(CAT_HOME);
      cat.current.rotation.set(0, 0, 0);
      body.current.position.y = 0;
      body.current.rotation.x = 0;
      head.current.rotation.set(0, 0, 0);
      tail.current.rotation.z = -0.38;
      tailTip.current.rotation.z = 0.35;
      leftPaw.current.rotation.x = 0;
      rightPaw.current.rotation.x = 0;
      leftHindLeg.current.rotation.x = 0;
      rightHindLeg.current.rotation.x = 0;
      return;
    }

    // Uncurl the root and chin smoothly when Mallow wakes at dawn.
    cat.current.rotation.z = THREE.MathUtils.damp(
      cat.current.rotation.z,
      0,
      3,
      delta,
    );
    head.current.rotation.x = THREE.MathUtils.damp(
      head.current.rotation.x,
      0,
      4,
      delta,
    );

    // Advance the current unpredictable decision by this rendered frame.
    const behavior = behaviorRoutine.advance(delta);
    const phaseTime = behavior.phaseTime;
    // Two journeys per cycle form one continuous route with no return-home reset.
    const firstIndex = behavior.cycleIndex * 2;
    const middleIndex = firstIndex + 1;
    const finalIndex = firstIndex + 2;
    // Cached points remain fixed for the duration of each deliberate stalk.
    const firstPoint = roamingRoute.point(firstIndex);
    const middlePoint = roamingRoute.point(middleIndex);
    const finalPoint = roamingRoute.point(finalIndex);
    // Store phase targets before applying shared smoothing.
    let desiredHeading = cat.current.rotation.y;
    let desiredHeadTurn = 0;
    let desiredBodyPitch = 0;
    let prowlEnergy = 0;
    let sittingEnergy = 0;

    if (behavior.phase === "watching") {
      // Crouch at the last destination and watch before choosing to move.
      cat.current.position.copy(firstPoint);
      cat.current.position.y += Math.sin(phaseTime * 1.6) * 0.008;
      desiredHeading = roamingRoute.heading(firstIndex, middleIndex);
      desiredHeadTurn =
        Math.sin(phaseTime * 0.75) * 0.38 + behavior.variation * 0.24;
      desiredBodyPitch = 0.04;
    } else if (behavior.phase === "prowling") {
      // Prowl toward a newly chosen place across the wider garden.
      const progress = behavior.progress;
      placeAlongRoamingJourney(
        cat.current.position,
        firstPoint,
        middlePoint,
        progress,
        behavior.variation * 1.15,
      );
      // Paw rhythm stays natural while the complete stalk covers ground slowly.
      cat.current.position.y +=
        Math.abs(Math.sin(phaseTime * 4.2)) *
        Math.sin(progress * Math.PI) *
        0.035;
      desiredHeading = roamingRoute.heading(firstIndex, middleIndex);
      desiredBodyPitch = 0.06;
      prowlEnergy = Math.sin(progress * Math.PI);
    } else if (behavior.phase === "sitting") {
      // Sit quietly at the far end and follow sounds with the head.
      cat.current.position.copy(middlePoint);
      cat.current.position.y += Math.sin(phaseTime * 1.8) * 0.008;
      desiredHeading = roamingRoute.heading(middleIndex, finalIndex);
      desiredHeadTurn =
        Math.sin(phaseTime * 0.95) * 0.46 + behavior.variation * 0.28;
      desiredBodyPitch = -0.06;
      sittingEnergy = 1;
    } else if (behavior.phase === "wandering") {
      // Slip onward to another destination instead of returning predictably.
      const progress = behavior.progress;
      placeAlongRoamingJourney(
        cat.current.position,
        middlePoint,
        finalPoint,
        progress,
        behavior.variation * 1.15,
      );
      cat.current.position.y +=
        Math.abs(Math.sin(phaseTime * 4.2)) *
        Math.sin(progress * Math.PI) *
        0.035;
      desiredHeading = roamingRoute.heading(middleIndex, finalIndex);
      desiredBodyPitch = 0.06;
      prowlEnergy = Math.sin(progress * Math.PI);
    } else {
      // Settle at the newly reached place before another watch begins.
      cat.current.position.copy(finalPoint);
      desiredHeading = roamingRoute.heading(finalIndex, finalIndex + 1);
      desiredHeadTurn = 0.12 + behavior.variation * 0.16;
    }

    // Measure the shortest signed angle between both body directions.
    const headingDifference = Math.atan2(
      Math.sin(desiredHeading - cat.current.rotation.y),
      Math.cos(desiredHeading - cat.current.rotation.y),
    );
    // Turn gradually so the cat never snaps around between phases.
    cat.current.rotation.y += headingDifference * Math.min(1, delta * 3.8);
    // Keep the low stalking posture smooth at the shoulders.
    cat.current.rotation.x = THREE.MathUtils.damp(
      cat.current.rotation.x,
      desiredBodyPitch,
      6,
      delta,
    );
    // Let the head lead the body's attention like a watchful cat.
    head.current.rotation.y = THREE.MathUtils.damp(
      head.current.rotation.y,
      desiredHeadTurn,
      7,
      delta,
    );
    // Lift and rotate the chest so the pause reads as a genuine sitting pose.
    body.current.position.y = THREE.MathUtils.damp(
      body.current.position.y,
      sittingEnergy * 0.12,
      6,
      delta,
    );
    body.current.rotation.x = THREE.MathUtils.damp(
      body.current.rotation.x,
      sittingEnergy * -0.42,
      6,
      delta,
    );
    // Combine a slow resting swish with extra balance during a prowl.
    tail.current.rotation.z =
      -0.38 +
      Math.sin(clock.elapsedTime * 1.25) * 0.2 +
      Math.sin(clock.elapsedTime * 5) * 0.08 * prowlEnergy;
    // Move the tail tip on a delayed rhythm for a flexible curved silhouette.
    tailTip.current.rotation.z =
      0.35 + Math.sin(clock.elapsedTime * 1.25 - 0.8) * 0.24;
    // Alternate the front paws only while the cat is moving.
    const pawStep = Math.sin(clock.elapsedTime * 8) * 0.3 * prowlEnergy;
    leftPaw.current.rotation.x = pawStep;
    rightPaw.current.rotation.x = -pawStep;
    // Move diagonal hind paws during a prowl, then fold both legs while sitting.
    leftHindLeg.current.rotation.x = THREE.MathUtils.damp(
      leftHindLeg.current.rotation.x,
      -pawStep + sittingEnergy * 1.05,
      7,
      delta,
    );
    rightHindLeg.current.rotation.x = THREE.MathUtils.damp(
      rightHindLeg.current.rotation.x,
      pawStep + sittingEnergy * 1.05,
      7,
      delta,
    );
  });

  // Keep the root transform with behavior while delegating visible geometry.
  return (
    <group
      ref={cat}
      position={CAT_HOME.toArray()}
      rotation={[0, 0, 0]}
      scale={0.5}
    >
      {/* This volume follows the cat throughout its complete garden roaming. */}
      <GardenInteractionTarget
        item={item}
        position={[0, 0.3, 0]}
        size={[3, 3, 4]}
        highlighted={highlighted}
      />
      <CatModel rig={rig} sleeping={sleeping} />
    </group>
  );
}
