// Drei draws many soft cloud particles through one efficient instanced mesh.
import { CloudInstance, Clouds } from "@react-three/drei";
// React references expose each cloud bank's Three.js group to the frame loop.
import { useRef } from "react";
// The frame hook advances cloud motion independently from React renders.
import { useFrame } from "@react-three/fiber";
// Three.js supplies the concrete group type stored by the reference.
import type { Group } from "three";
// The pure helper wraps drifting banks invisibly beyond the garden horizon.
import { advanceCloudPosition } from "./garden-clouds";
// The current light phase lets clouds inherit daytime, twilight, or moonlight color.
import type { GardenLightPhase } from "./uk-garden-time";

// This local radial texture gives every cloud particle a feathered edge offline.
const SOFT_CLOUD_TEXTURE = "/cloud-soft.svg";

// A tuple documents positions in the same x, y, z order Three.js expects.
type CloudPosition = [number, number, number];
// A separate tuple name distinguishes spatial size from world position.
type CloudBounds = [number, number, number];

// Each bank has a stable identity, silhouette, position, and wind speed.
type CloudBankDescription = {
  // A stable key lets React preserve motion while the clock changes color.
  id: string;
  // The seed makes its puff arrangement deterministic between visits.
  seed: number;
  // Position places it high enough to feel overhead rather than like garden fog.
  position: CloudPosition;
  // Bounds shape each bank into a broad, shallow natural formation.
  bounds: CloudBounds;
  // Scale creates distant variation without increasing particle count.
  scale: number;
  // Drift speed is measured in world units per second.
  driftSpeed: number;
};

// Five separated banks create depth without turning the blue sky overcast.
const CLOUD_BANKS: CloudBankDescription[] = [
  {
    id: "western-cumulus",
    seed: 2,
    position: [-42, 18, -24],
    bounds: [9, 2.2, 3.4],
    scale: 1.15,
    driftSpeed: 0.42,
  },
  {
    id: "high-meadow-cloud",
    seed: 7,
    position: [-17, 23, -36],
    bounds: [12, 1.8, 3],
    scale: 1.35,
    driftSpeed: 0.31,
  },
  {
    id: "garden-cumulus",
    seed: 13,
    position: [8, 20, -18],
    bounds: [8, 2.8, 3.6],
    scale: 1,
    driftSpeed: 0.48,
  },
  {
    id: "eastern-wisp",
    seed: 19,
    position: [31, 25, -30],
    bounds: [13, 1.5, 2.8],
    scale: 1.25,
    driftSpeed: 0.36,
  },
  {
    id: "near-sky-cloud",
    seed: 29,
    position: [46, 17, -8],
    bounds: [7, 2, 3],
    scale: 0.9,
    driftSpeed: 0.54,
  },
];

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
