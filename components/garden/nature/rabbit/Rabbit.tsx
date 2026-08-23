// The render-loop hook lets the rabbit behave without React rerenders.
import { useFrame } from "@react-three/fiber";
// Refs expose the rabbit's moving parts to the animation function.
import { useRef } from "react";
// Three supplies vectors, groups, and smooth interpolation helpers.
import * as THREE from "three";
// RabbitModel keeps all visible mesh geometry out of this behavior module.
import { RabbitModel, type RabbitRig } from "./RabbitModel";

// These reusable vectors describe the rabbit's short foraging route.
const RABBIT_START = new THREE.Vector3(8, 0.26, 4.8);
const RABBIT_END = new THREE.Vector3(11.2, 0.26, 8.3);
// Each heading points the rabbit toward one end of its route.
const OUTBOUND_HEADING = Math.atan2(
  RABBIT_END.x - RABBIT_START.x,
  RABBIT_END.z - RABBIT_START.z,
);
const RETURN_HEADING = Math.atan2(
  RABBIT_START.x - RABBIT_END.x,
  RABBIT_START.z - RABBIT_END.z,
);

// Build a little garden rabbit that nibbles, listens, and bounds through grass.
export function Rabbit({ animated = true }: { animated?: boolean }) {
  // This group moves the complete rabbit along its route.
  const rabbit = useRef<THREE.Group>(null);
  // The head dips independently when the rabbit eats.
  const head = useRef<THREE.Group>(null);
  // Ear refs create separate alert twitches.
  const leftEar = useRef<THREE.Mesh>(null);
  const rightEar = useRef<THREE.Mesh>(null);
  // Package the model's internal attachment points behind one private interface.
  const rig: RabbitRig = { head, leftEar, rightEar };

  // Repeat a sixteen-second forage, bound, listen, and return sequence.
  useFrame(({ clock }, delta) => {
    // Wait until React has attached every moving scene object.
    if (
      !rabbit.current ||
      !head.current ||
      !leftEar.current ||
      !rightEar.current
    )
      return;
    // Use a calm grounded pose when reduced motion is requested.
    if (!animated) {
      rabbit.current.position.copy(RABBIT_START);
      rabbit.current.rotation.set(0, OUTBOUND_HEADING, 0);
      head.current.rotation.set(0.12, 0, 0);
      leftEar.current.rotation.z = 0.08;
      rightEar.current.rotation.z = -0.08;
      return;
    }

    // Wrap elapsed time so the behavior repeats forever.
    const cycle = clock.elapsedTime % 16;
    // Begin with the current pose and let each phase choose new targets.
    let desiredHeading = rabbit.current.rotation.y;
    let desiredHeadPitch = head.current.rotation.x;
    let boundEnergy = 0;

    if (cycle < 4) {
      // Stay near the first patch while making small nibbling movements.
      rabbit.current.position.copy(RABBIT_START);
      rabbit.current.position.y += Math.sin(cycle * 2.4) * 0.012;
      desiredHeading = OUTBOUND_HEADING;
      desiredHeadPitch = 0.2 + Math.abs(Math.sin(cycle * 2.8)) * 0.2;
    } else if (cycle < 8) {
      // Bound toward the second patch with smooth acceleration and landing.
      const progress = (cycle - 4) / 4;
      const eased = THREE.MathUtils.smoothstep(progress, 0, 1);
      rabbit.current.position.lerpVectors(RABBIT_START, RABBIT_END, eased);
      rabbit.current.position.y +=
        Math.abs(Math.sin(progress * Math.PI * 5)) * 0.24;
      desiredHeading = OUTBOUND_HEADING;
      desiredHeadPitch = -0.08;
      boundEnergy = Math.sin(progress * Math.PI);
    } else if (cycle < 12) {
      // Sit at the far patch and scan for sounds before returning.
      rabbit.current.position.copy(RABBIT_END);
      rabbit.current.position.y += Math.sin(cycle * 2) * 0.01;
      desiredHeading = RETURN_HEADING + Math.sin(cycle * 0.85) * 0.22;
      desiredHeadPitch = -0.05;
    } else {
      // Follow the same soft bounding gait back to the first patch.
      const progress = (cycle - 12) / 4;
      const eased = THREE.MathUtils.smoothstep(progress, 0, 1);
      rabbit.current.position.lerpVectors(RABBIT_END, RABBIT_START, eased);
      rabbit.current.position.y +=
        Math.abs(Math.sin(progress * Math.PI * 5)) * 0.24;
      desiredHeading = RETURN_HEADING;
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
      position={RABBIT_START.toArray()}
      rotation={[0, OUTBOUND_HEADING, 0]}
      scale={0.55}
    >
      <RabbitModel rig={rig} />
    </group>
  );
}
