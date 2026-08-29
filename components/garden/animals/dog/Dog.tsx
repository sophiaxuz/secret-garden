// The render-loop hook powers the dog's wandering behavior.
import { useFrame } from "@react-three/fiber";
// Refs keep mutable Three.js parts available between renders.
import { useRef } from "react";
// Three provides scene types, route vectors, and damping helpers.
import * as THREE from "three";
// One shared target follows the dog without entering its visible model.
import { GardenInteractionTarget } from "../../interaction/GardenInteractionTarget";
// Shared habitat data supplies the dog's first position when a visit begins.
import { ANIMAL_HABITATS, createHabitatVector } from "../animal-habitats";
// The shared planner varies pauses and attention choices across every visit.
import { createAnimalRoutine, type AnimalRoutine } from "../animal-routine";
// Garden-wide roaming replaces the dog's former two-point local patrol.
import {
  createAnimalRoamingRoute,
  placeAlongRoamingJourney,
  type AnimalRoamingRoute,
} from "../animal-roaming";
// The dog uses the identity and highlight shared by all animals.
import type { AnimatedAnimalProps } from "../animal-identities";
// DogModel keeps all visible mesh geometry out of this behavior module.
import { DogModel, type DogRig } from "./DogModel";

// The authored western habitat remains the dog's stable first rendered position.
const DOG_HOME = createHabitatVector(ANIMAL_HABITATS.dog.start);

// Ranges preserve the dog's story while removing the fixed twenty-four-second loop.
const DOG_ROUTINE = [
  { name: "sniffing", minDuration: 2.5, maxDuration: 7 },
  { name: "wandering", minDuration: 5.5, maxDuration: 11 },
  { name: "watching", minDuration: 2.5, maxDuration: 8 },
  { name: "exploring", minDuration: 5.5, maxDuration: 11 },
  { name: "resting", minDuration: 1.5, maxDuration: 5 },
] as const;
// Derive the phase-name union so behavior code cannot misspell a routine phase.
type DogRoutineName = (typeof DOG_ROUTINE)[number]["name"];

// Build a friendly garden dog that sniffs, trots, watches, and wags.
export function Dog({
  animated = true,
  item,
  highlighted = false,
}: AnimatedAnimalProps) {
  // The root group controls the dog's world position and direction.
  const dog = useRef<THREE.Group>(null);
  // The head looks and sniffs independently from the body.
  const head = useRef<THREE.Group>(null);
  // The tail pivots rapidly when the dog is excited.
  const tail = useRef<THREE.Group>(null);
  // Four leg refs create an alternating walking gait.
  const frontLeftLeg = useRef<THREE.Mesh>(null);
  const frontRightLeg = useRef<THREE.Mesh>(null);
  const backLeftLeg = useRef<THREE.Mesh>(null);
  const backRightLeg = useRef<THREE.Mesh>(null);
  // One seed ties the dog's timing and destination personality together.
  const personalitySeed = useRef(Math.random() * 10_000).current;
  // A fresh personality seed makes each mounted visit choose a different rhythm.
  const routine = useRef<AnimalRoutine<DogRoutineName> | null>(null);
  // Create once so ordinary React rerenders do not reset the dog's decisions.
  if (!routine.current) {
    routine.current = createAnimalRoutine(personalitySeed, DOG_ROUTINE);
  }
  // Capture the initialized planner so the frame callback sees a non-null routine.
  const behaviorRoutine = routine.current;
  // Cache the route planner so already chosen destinations never move mid-journey.
  const roaming = useRef<AnimalRoamingRoute | null>(null);
  if (!roaming.current) {
    roaming.current = createAnimalRoamingRoute(
      personalitySeed,
      ANIMAL_HABITATS.dog.start,
    );
  }
  // Capture the initialized route for use inside the animation callback.
  const roamingRoute = roaming.current;
  // Package the model's internal attachment points behind one private interface.
  const rig: DogRig = {
    head,
    tail,
    frontLeftLeg,
    frontRightLeg,
    backLeftLeg,
    backRightLeg,
  };

  // Continue choosing new places throughout the complete garden visit.
  useFrame(({ clock }, delta) => {
    // Wait until every animated piece exists in the Three.js scene.
    if (
      !dog.current ||
      !head.current ||
      !tail.current ||
      !frontLeftLeg.current ||
      !frontRightLeg.current ||
      !backLeftLeg.current ||
      !backRightLeg.current
    )
      return;
    // Reset to a friendly standing pose for reduced-motion visitors.
    if (!animated) {
      dog.current.position.copy(DOG_HOME);
      dog.current.rotation.set(0, 0, 0);
      head.current.rotation.set(0, 0, 0);
      tail.current.rotation.z = 0.22;
      frontLeftLeg.current.rotation.x = 0;
      frontRightLeg.current.rotation.x = 0;
      backLeftLeg.current.rotation.x = 0;
      backRightLeg.current.rotation.x = 0;
      return;
    }

    // Advance the variable routine and reuse its phase-local time for small motions.
    const behavior = behaviorRoutine.advance(delta);
    const phaseTime = behavior.phaseTime;
    // Two fresh destinations per routine cycle create one continuous roaming chain.
    const firstIndex = behavior.cycleIndex * 2;
    const middleIndex = firstIndex + 1;
    const finalIndex = firstIndex + 2;
    // Resolve stable endpoints once for the current rendered frame.
    const firstPoint = roamingRoute.point(firstIndex);
    const middlePoint = roamingRoute.point(middleIndex);
    const finalPoint = roamingRoute.point(finalIndex);
    // Each phase updates these targets before the shared smoothing code runs.
    let desiredHeading = dog.current.rotation.y;
    let desiredHeadPitch = 0;
    let desiredHeadTurn = 0;
    let gaitEnergy = 0;

    if (behavior.phase === "sniffing") {
      // Sniff whichever patch the previous garden-wide journey reached.
      dog.current.position.copy(firstPoint);
      dog.current.position.y += Math.sin(phaseTime * 2.2) * 0.012;
      desiredHeading = roamingRoute.heading(firstIndex, middleIndex);
      desiredHeadPitch = 0.26 + Math.sin(phaseTime * 2.6) * 0.08;
      desiredHeadTurn =
        Math.sin(phaseTime * 0.9) * 0.18 + behavior.variation * 0.16;
    } else if (behavior.phase === "wandering") {
      // Trot toward a newly selected place anywhere in the garden.
      const progress = behavior.progress;
      placeAlongRoamingJourney(
        dog.current.position,
        firstPoint,
        middlePoint,
        progress,
        behavior.variation * 1.4,
      );
      dog.current.position.y +=
        Math.abs(Math.sin(progress * Math.PI * 8)) * 0.07;
      desiredHeading = roamingRoute.heading(firstIndex, middleIndex);
      gaitEnergy = Math.sin(progress * Math.PI);
    } else if (behavior.phase === "watching") {
      // Pause at the end and watch different parts of the garden.
      dog.current.position.copy(middlePoint);
      dog.current.position.y += Math.sin(phaseTime * 1.7) * 0.01;
      desiredHeading = roamingRoute.heading(middleIndex, finalIndex);
      desiredHeadTurn =
        Math.sin(phaseTime * 0.8) * 0.35 + behavior.variation * 0.2;
      desiredHeadPitch = -0.05;
    } else if (behavior.phase === "exploring") {
      // Continue onward instead of predictably returning to the old home patch.
      const progress = behavior.progress;
      placeAlongRoamingJourney(
        dog.current.position,
        middlePoint,
        finalPoint,
        progress,
        behavior.variation * 1.4,
      );
      dog.current.position.y +=
        Math.abs(Math.sin(progress * Math.PI * 8)) * 0.07;
      desiredHeading = roamingRoute.heading(middleIndex, finalIndex);
      gaitEnergy = Math.sin(progress * Math.PI);
    } else {
      // Rest at the new destination before deciding where to wander next.
      dog.current.position.copy(finalPoint);
      desiredHeading = roamingRoute.heading(finalIndex, finalIndex + 1);
      desiredHeadPitch = 0.08;
      desiredHeadTurn =
        Math.sin(phaseTime * 1.1) * 0.16 + behavior.variation * 0.12;
    }

    // Calculate the shortest body turn to avoid spinning at route changes.
    const headingDifference = Math.atan2(
      Math.sin(desiredHeading - dog.current.rotation.y),
      Math.cos(desiredHeading - dog.current.rotation.y),
    );
    // Blend the body direction so the dog turns during pauses naturally.
    dog.current.rotation.y += headingDifference * Math.min(1, delta * 3.5);
    // Smoothly raise and lower the muzzle for sniffing behavior.
    head.current.rotation.x = THREE.MathUtils.damp(
      head.current.rotation.x,
      desiredHeadPitch,
      7,
      delta,
    );
    // Smoothly look from side to side while the dog is standing.
    head.current.rotation.y = THREE.MathUtils.damp(
      head.current.rotation.y,
      desiredHeadTurn,
      6,
      delta,
    );
    // Wag continuously, adding faster movement during the walking phases.
    tail.current.rotation.z =
      0.22 +
      Math.sin(clock.elapsedTime * 4.5) * 0.28 +
      Math.sin(clock.elapsedTime * 9) * 0.12 * gaitEnergy;
    // Move diagonal pairs together to imitate a natural trot.
    const step = Math.sin(clock.elapsedTime * 9) * 0.42 * gaitEnergy;
    frontLeftLeg.current.rotation.x = step;
    backRightLeg.current.rotation.x = step;
    frontRightLeg.current.rotation.x = -step;
    backLeftLeg.current.rotation.x = -step;
  });

  // Keep the root transform with behavior while delegating visible geometry.
  return (
    <group
      ref={dog}
      position={DOG_HOME.toArray()}
      rotation={[0, 0, 0]}
      scale={0.58}
    >
      {/* This volume follows the dog wherever it wanders in the garden. */}
      <GardenInteractionTarget
        item={item}
        position={[0, 0.35, 0]}
        size={[3, 3, 4]}
        highlighted={highlighted}
      />
      <DogModel rig={rig} />
    </group>
  );
}
