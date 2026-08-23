// Drei draws many soft cloud particles through one efficient instanced mesh.
import { CloudInstance, Clouds } from "@react-three/drei";
// React references expose each cloud bank's Three.js group to the frame loop.
import { useRef } from "react";
// The frame hook advances cloud motion independently from React renders.
import { useFrame } from "@react-three/fiber";
// Three.js supplies the concrete group type stored by the reference.
import type { Group } from "three";
// The pure helper wraps drifting banks invisibly beyond the garden horizon.
import {
  advanceCloudPosition,
  CLOUD_BANKS,
  type CloudBankDescription,
} from "./garden-clouds";
// The current light phase lets clouds inherit daytime, twilight, or moonlight color.
import type { GardenLightPhase } from "./uk-garden-time";

// This local radial texture gives every cloud particle a feathered edge offline.
const SOFT_CLOUD_TEXTURE = "/cloud-soft.svg";

// Describe the changing atmosphere needed by the full cloud field.
type GardenCloudsProps = {
  // Phase colors the same cloud forms without rebuilding their geometry.
  phase: GardenLightPhase;
};

// Describe the stable and atmospheric values required by one moving bank.
type MovingCloudBankProps = {
  // Description contains its deterministic layout and motion settings.
  bank: CloudBankDescription;
  // Color carries the current celestial light into the soft cloud material.
  color: string;
  // Opacity keeps blue sky visible between formations.
  opacity: number;
};

// Move one cloud bank continuously and wrap it beyond the visible horizon.
function MovingCloudBank({ bank, color, opacity }: MovingCloudBankProps) {
  // The group reference gives the animation loop one mutable x position.
  const cloudRef = useRef<Group>(null);

  // Update motion on rendered frames without re-rendering React every frame.
  useFrame((_state, delta) => {
    // A group can briefly be absent while the component mounts or unmounts.
    if (!cloudRef.current) return;
    // Frame delta makes drift speed independent of the visitor's frame rate.
    const windDistance = bank.driftSpeed * delta;
    // Wrapping outside the view creates an endless but non-reversing wind.
    cloudRef.current.position.x = advanceCloudPosition(
      cloudRef.current.position.x,
      windDistance,
    );
  });

  // CloudInstance adds soft billboards to the parent's shared instanced mesh.
  return (
    <CloudInstance
      ref={cloudRef}
      position={bank.position}
      scale={bank.scale}
      seed={bank.seed}
      segments={14}
      bounds={bank.bounds}
      volume={5.5}
      smallestVolume={0.2}
      growth={3.2}
      speed={0.06}
      fade={18}
      opacity={opacity}
      color={color}
    />
  );
}

// Render all cloud banks with colors drawn from the garden's real-time phase.
export function GardenClouds({ phase }: GardenCloudsProps) {
  // Day clouds are creamy white, while twilight and night borrow the sky palette.
  const cloudColor =
    phase === "day"
      ? "#fff8e7"
      : phase === "night"
        ? "#7888a2"
        : phase === "dawn"
          ? "#e9c3b5"
          : "#dfaaa5";
  // Slightly clearer night banks avoid masking the Moon and starscape-like sky.
  const cloudOpacity = phase === "night" ? 0.42 : 0.62;

  // One Clouds parent batches every puff into a single draw call.
  return (
    <Clouds
      texture={SOFT_CLOUD_TEXTURE}
      limit={CLOUD_BANKS.length * 14}
      frustumCulled={false}
    >
      {/* Stable descriptions preserve each bank's form as time updates. */}
      {CLOUD_BANKS.map((bank) => (
        <MovingCloudBank
          key={bank.id}
          bank={bank}
          color={cloudColor}
          opacity={cloudOpacity}
        />
      ))}
    </Clouds>
  );
}
