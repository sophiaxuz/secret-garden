// The render-loop hook powers the dog's wandering behavior.
import { useFrame } from "@react-three/fiber";
// Refs keep mutable Three.js parts available between renders.
import { useRef } from "react";
// Three provides scene types, route vectors, and damping helpers.
import * as THREE from "three";
// One shared target follows the dog without entering its visible model.
import { GardenInteractionTarget } from "../../interaction/GardenInteractionTarget";
// Shared habitat data keeps the dog's patrol easy to relocate with the garden.
import { ANIMAL_HABITATS, createRoundTripRoute } from "../animal-habitats";
// The dog uses the identity and highlight shared by all animals.
import type { AnimatedAnimalProps } from "../animal-identities";
// DogModel keeps all visible mesh geometry out of this behavior module.
import { DogModel, type DogRig } from "./DogModel";

// The dog follows this short route beside the path rather than roaming randomly.
const {
  start: DOG_START,
  end: DOG_END,
  outboundHeading: OUTBOUND_HEADING,
  returnHeading: RETURN_HEADING,
} = createRoundTripRoute(ANIMAL_HABITATS.dog);

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
  // Package the model's internal attachment points behind one private interface.
  const rig: DogRig = {
    head,
    tail,
    frontLeftLeg,
    frontRightLeg,
    backLeftLeg,
    backRightLeg,
  };

  // Repeat a relaxed twenty-four-second garden patrol.
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
      dog.current.position.copy(DOG_START);
      dog.current.rotation.set(0, OUTBOUND_HEADING, 0);
      head.current.rotation.set(0, 0, 0);
      tail.current.rotation.z = 0.22;
      frontLeftLeg.current.rotation.x = 0;
      frontRightLeg.current.rotation.x = 0;
      backLeftLeg.current.rotation.x = 0;
      backRightLeg.current.rotation.x = 0;
      return;
    }

    // Convert elapsed time into one repeating behavior cycle.
    const cycle = clock.elapsedTime % 24;
    // Each phase updates these targets before the shared smoothing code runs.
    let desiredHeading = dog.current.rotation.y;
    let desiredHeadPitch = 0;
    let desiredHeadTurn = 0;
    let gaitEnergy = 0;

    if (cycle < 5) {
      // Sniff a patch near the route's beginning.
      dog.current.position.copy(DOG_START);
      dog.current.position.y += Math.sin(cycle * 2.2) * 0.012;
      desiredHeading = OUTBOUND_HEADING;
      desiredHeadPitch = 0.26 + Math.sin(cycle * 2.6) * 0.08;
      desiredHeadTurn = Math.sin(cycle * 0.9) * 0.18;
    } else if (cycle < 11) {
      // Trot toward the far patch with a gentle rise on each step.
      const progress = (cycle - 5) / 6;
      const eased = THREE.MathUtils.smoothstep(progress, 0, 1);
      dog.current.position.lerpVectors(DOG_START, DOG_END, eased);
      dog.current.position.y +=
        Math.abs(Math.sin(progress * Math.PI * 8)) * 0.07;
      desiredHeading = OUTBOUND_HEADING;
      gaitEnergy = Math.sin(progress * Math.PI);
    } else if (cycle < 16) {
      // Pause at the end and watch different parts of the garden.
      dog.current.position.copy(DOG_END);
      dog.current.position.y += Math.sin(cycle * 1.7) * 0.01;
      desiredHeading = RETURN_HEADING;
      desiredHeadTurn = Math.sin(cycle * 0.8) * 0.35;
      desiredHeadPitch = -0.05;
    } else if (cycle < 22) {
      // Trot home along the reverse route.
      const progress = (cycle - 16) / 6;
      const eased = THREE.MathUtils.smoothstep(progress, 0, 1);
      dog.current.position.lerpVectors(DOG_END, DOG_START, eased);
      dog.current.position.y +=
        Math.abs(Math.sin(progress * Math.PI * 8)) * 0.07;
      desiredHeading = RETURN_HEADING;
      gaitEnergy = Math.sin(progress * Math.PI);
    } else {
      // Rest at the starting patch before beginning another patrol.
      dog.current.position.copy(DOG_START);
      desiredHeading = OUTBOUND_HEADING;
      desiredHeadPitch = 0.08;
      desiredHeadTurn = Math.sin(cycle * 1.1) * 0.16;
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
      position={DOG_START.toArray()}
      rotation={[0, OUTBOUND_HEADING, 0]}
      scale={0.58}
    >
      {/* This volume follows the complete dog along both halves of its patrol. */}
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
