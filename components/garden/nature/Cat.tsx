// The render-loop hook gives the cat continuous, quiet movement.
import { useFrame } from "@react-three/fiber";
// Refs expose the cat's head, tail, and paws to animation code.
import { useRef } from "react";
// Three provides vectors and interpolation helpers for the patrol route.
import * as THREE from "three";

// The cat patrols a shaded route deeper in the garden.
const CAT_START = new THREE.Vector3(4.35, 0.4, -3.35);
const CAT_END = new THREE.Vector3(2.55, 0.4, -5.65);
// These headings point toward the two ends of the cat's route.
const OUTBOUND_HEADING = Math.atan2(
  CAT_END.x - CAT_START.x,
  CAT_END.z - CAT_START.z,
);
const RETURN_HEADING = Math.atan2(
  CAT_START.x - CAT_END.x,
  CAT_START.z - CAT_END.z,
);

// Build a grey tabby that watches, prowls, pauses, and returns.
export function Cat({ animated = true }: { animated?: boolean }) {
  // The root group controls the complete cat's world transform.
  const cat = useRef<THREE.Group>(null);
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

  // Repeat a twenty-second watch, prowl, sit, and return sequence.
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
    // Return to a composed standing pose when motion should be reduced.
    if (!animated) {
      cat.current.position.copy(CAT_START);
      cat.current.rotation.set(0, OUTBOUND_HEADING, 0);
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

    // Wrap time into one repeating patrol cycle.
    const cycle = clock.elapsedTime % 20;
    // Store phase targets before applying shared smoothing.
    let desiredHeading = cat.current.rotation.y;
    let desiredHeadTurn = 0;
    let desiredBodyPitch = 0;
    let prowlEnergy = 0;
    let sittingEnergy = 0;

    if (cycle < 4) {
      // Crouch near the first patch and watch the nearby path.
      cat.current.position.copy(CAT_START);
      cat.current.position.y += Math.sin(cycle * 1.6) * 0.008;
      desiredHeading = OUTBOUND_HEADING;
      desiredHeadTurn = Math.sin(cycle * 0.75) * 0.38;
      desiredBodyPitch = 0.04;
    } else if (cycle < 9) {
      // Prowl toward the shaded end with smooth, low steps.
      const progress = (cycle - 4) / 5;
      const eased = THREE.MathUtils.smoothstep(progress, 0, 1);
      cat.current.position.lerpVectors(CAT_START, CAT_END, eased);
      cat.current.position.y +=
        Math.abs(Math.sin(progress * Math.PI * 7)) * 0.035;
      desiredHeading = OUTBOUND_HEADING;
      desiredBodyPitch = 0.06;
      prowlEnergy = Math.sin(progress * Math.PI);
    } else if (cycle < 14) {
      // Sit quietly at the far end and follow sounds with the head.
      cat.current.position.copy(CAT_END);
      cat.current.position.y += Math.sin(cycle * 1.8) * 0.008;
      desiredHeading = RETURN_HEADING;
      desiredHeadTurn = Math.sin(cycle * 0.95) * 0.46;
      desiredBodyPitch = -0.06;
      sittingEnergy = 1;
    } else if (cycle < 19) {
      // Return with the same deliberate stalking gait.
      const progress = (cycle - 14) / 5;
      const eased = THREE.MathUtils.smoothstep(progress, 0, 1);
      cat.current.position.lerpVectors(CAT_END, CAT_START, eased);
      cat.current.position.y +=
        Math.abs(Math.sin(progress * Math.PI * 7)) * 0.035;
      desiredHeading = RETURN_HEADING;
      desiredBodyPitch = 0.06;
      prowlEnergy = Math.sin(progress * Math.PI);
    } else {
      // Settle at the start before beginning another watch.
      cat.current.position.copy(CAT_START);
      desiredHeading = OUTBOUND_HEADING;
      desiredHeadTurn = 0.12;
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

  // Render the tabby with rounded low-poly geometry and a readable face.
  return (
    <group
      ref={cat}
      position={CAT_START.toArray()}
      rotation={[0, OUTBOUND_HEADING, 0]}
      scale={0.5}
    >
      {/* The torso and head share a group that rises into the sitting pose. */}
      <group ref={body}>
        {/* A slim oval forms the cat's flexible torso. */}
        <mesh scale={[0.58, 0.54, 1.05]}>
          <sphereGeometry args={[0.68, 17, 11]} />
          <meshStandardMaterial color="#777873" roughness={1} />
        </mesh>
        {/* A lighter chest patch adds depth beneath the face. */}
        <mesh position={[0, 0.02, 0.64]} scale={[0.38, 0.44, 0.2]}>
          <sphereGeometry args={[0.7, 13, 9]} />
          <meshStandardMaterial color="#c8c3b7" roughness={1} />
        </mesh>
        {/* Group every facial feature so the cat can look around. */}
        <group ref={head} position={[0, 0.3, 0.82]}>
          {/* A rounded head keeps the stylized cat soft and approachable. */}
          <mesh scale={[0.84, 0.78, 0.76]}>
            <sphereGeometry args={[0.5, 16, 10]} />
            <meshStandardMaterial color="#7f807b" roughness={1} />
          </mesh>
          {/* Two triangular ears create the cat's unmistakable silhouette. */}
          <mesh position={[-0.28, 0.43, -0.02]} rotation={[0, 0, -0.08]}>
            <coneGeometry args={[0.18, 0.48, 7]} />
            <meshStandardMaterial color="#686a66" roughness={1} />
          </mesh>
          <mesh position={[0.28, 0.43, -0.02]} rotation={[0, 0, 0.08]}>
            <coneGeometry args={[0.18, 0.48, 7]} />
            <meshStandardMaterial color="#686a66" roughness={1} />
          </mesh>
          {/* Green eyes stand out against the grey face. */}
          <mesh position={[-0.2, 0.08, 0.36]} scale={[1.15, 0.82, 0.72]}>
            <sphereGeometry args={[0.075, 10, 7]} />
            <meshStandardMaterial color="#a8bf73" roughness={0.35} />
          </mesh>
          <mesh position={[0.2, 0.08, 0.36]} scale={[1.15, 0.82, 0.72]}>
            <sphereGeometry args={[0.075, 10, 7]} />
            <meshStandardMaterial color="#a8bf73" roughness={0.35} />
          </mesh>
          {/* Narrow pupils make the green eyes read clearly as feline. */}
          <mesh position={[-0.2, 0.08, 0.42]} scale={[0.32, 1, 0.3]}>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshBasicMaterial color="#171916" />
          </mesh>
          <mesh position={[0.2, 0.08, 0.42]} scale={[0.32, 1, 0.3]}>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshBasicMaterial color="#171916" />
          </mesh>
          {/* A pale muzzle sits below the eyes. */}
          <mesh position={[0, -0.12, 0.39]} scale={[0.45, 0.25, 0.18]}>
            <sphereGeometry args={[0.7, 12, 8]} />
            <meshStandardMaterial color="#d5d0c5" roughness={1} />
          </mesh>
          {/* A tiny muted-pink nose completes the central face. */}
          <mesh position={[0, -0.055, 0.52]} scale={[1.1, 0.72, 0.75]}>
            <sphereGeometry args={[0.065, 9, 6]} />
            <meshStandardMaterial color="#9d6e6b" roughness={0.65} />
          </mesh>
          {/* Three fine whiskers extend from each side of the muzzle. */}
          {[-1, 1].map((side) =>
            [-0.08, 0, 0.08].map((height) => (
              <mesh
                key={`${side}-${height}`}
                position={[side * 0.34, -0.12 + height, 0.45]}
                rotation={[0, 0, Math.PI / 2 + height * side]}
              >
                <cylinderGeometry args={[0.006, 0.006, 0.36, 5]} />
                <meshBasicMaterial color="#403f3b" />
              </mesh>
            )),
          )}
        </group>
      </group>
      {/* Four slim legs connect the cat's body to the ground. */}
      <mesh ref={leftPaw} position={[-0.28, -0.46, 0.52]}>
        <cylinderGeometry args={[0.08, 0.1, 0.65, 8]} />
        <meshStandardMaterial color="#70716d" roughness={1} />
      </mesh>
      <mesh ref={rightPaw} position={[0.28, -0.46, 0.52]}>
        <cylinderGeometry args={[0.08, 0.1, 0.65, 8]} />
        <meshStandardMaterial color="#70716d" roughness={1} />
      </mesh>
      <mesh ref={leftHindLeg} position={[-0.28, -0.46, -0.48]}>
        <cylinderGeometry args={[0.09, 0.11, 0.65, 8]} />
        <meshStandardMaterial color="#70716d" roughness={1} />
      </mesh>
      <mesh ref={rightHindLeg} position={[0.28, -0.46, -0.48]}>
        <cylinderGeometry args={[0.09, 0.11, 0.65, 8]} />
        <meshStandardMaterial color="#70716d" roughness={1} />
      </mesh>
      {/* Two linked tail sections create a curled, expressive shape. */}
      <group ref={tail} position={[0, 0.08, -0.88]} rotation={[-0.7, 0, -0.38]}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.09, 0.13, 0.9, 9]} />
          <meshStandardMaterial color="#676965" roughness={1} />
        </mesh>
        <group ref={tailTip} position={[0, 0.86, 0]} rotation={[0, 0, 0.35]}>
          <mesh position={[0, 0.33, 0]}>
            <cylinderGeometry args={[0.065, 0.095, 0.66, 9]} />
            <meshStandardMaterial color="#676965" roughness={1} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
