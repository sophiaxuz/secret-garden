// React memoizes cloud geometry and releases its GPU buffers after use.
import { useEffect, useMemo, useRef } from "react";
// The frame hook advances cloud motion independently from React renders.
import { useFrame } from "@react-three/fiber";
// Three.js supplies the concrete group type stored by the movement reference.
import type { Group } from "three";
// The geometry factory makes opaque volume instead of fragile alpha billboards.
import { createCloudBankGeometry } from "./cloud-geometry";
// The pure layout and drift helper remain independent from React and rendering.
import {
  advanceCloudPosition,
  CLOUD_BANKS,
  type CloudBankDescription,
} from "./garden-clouds";
// The current light phase lets clouds inherit daytime, twilight, or moonlight color.
import type { GardenLightPhase } from "./uk-garden-time";

// Describe the changing atmosphere needed by the full cloud field.
type GardenCloudsProps = {
  // Phase colors the same cloud forms without rebuilding their geometry.
  phase: GardenLightPhase;
};

// Describe the stable and atmospheric values required by one moving bank.
type MovingCloudBankProps = {
  // Description contains its deterministic layout and motion settings.
  bank: CloudBankDescription;
  // Color carries the current celestial light into the shaded cloud material.
  color: string;
  // A faint glow keeps moonlit and backlit cloud silhouettes legible.
  glowIntensity: number;
};

// Move one opaque cloud bank continuously and wrap it beyond the visible horizon.
function MovingCloudBank({ bank, color, glowIntensity }: MovingCloudBankProps) {
  // The group reference gives the animation loop one mutable x position.
  const cloudRef = useRef<Group>(null);
  // Build one merged cloud mesh for this stable bank description.
  const geometry = useMemo(
    () => createCloudBankGeometry(bank.bounds, bank.seed),
    [bank.bounds, bank.seed],
  );

  // Release manually constructed geometry if this cloud bank leaves the scene.
  useEffect(() => {
    // Disposal frees the merged vertex buffers from the visitor's GPU.
    return () => geometry.dispose();
  }, [geometry]);

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

  // One merged mesh renders all eight lobes in this complete cloud bank.
  return (
    <group
      ref={cloudRef}
      position={bank.position}
      rotation={[0, bank.seed * 0.09, 0]}
      scale={bank.scale}
    >
      {/* Opaque geometry cannot silently disappear through texture-alpha failure. */}
      <mesh geometry={geometry} frustumCulled={false}>
        {/* Vertex shades give the rounded cloud a visible grey underside. */}
        <meshStandardMaterial
          color={color}
          vertexColors
          roughness={1}
          metalness={0}
          emissive={color}
          emissiveIntensity={glowIntensity}
        />
      </mesh>
    </group>
  );
}

// Render all opaque cloud banks with colors drawn from the real-time light phase.
export function GardenClouds({ phase }: GardenCloudsProps) {
  // Day clouds are creamy white, while twilight and night borrow the sky palette.
  const cloudColor =
    phase === "day"
      ? "#f6f3e8"
      : phase === "night"
        ? "#78869f"
        : phase === "dawn"
          ? "#e8c5b7"
          : "#dda9a5";
  // Night receives a little more self-light because moonlight is deliberately subtle.
  const glowIntensity = phase === "night" ? 0.16 : 0.07;

  // Stable descriptions preserve each cloud's form as the UK clock updates.
  return (
    <>
      {/* Five meshes replace one unreliable transparent billboard batch. */}
      {CLOUD_BANKS.map((bank) => (
        <MovingCloudBank
          key={bank.id}
          bank={bank}
          color={cloudColor}
          glowIntensity={glowIntensity}
        />
      ))}
    </>
  );
}
