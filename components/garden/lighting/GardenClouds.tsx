// Drei loads the two local, transparent cloud textures into Three.js.
import { useTexture } from "@react-three/drei";
// The frame hook advances cloud motion independently from React renders.
import { useFrame } from "@react-three/fiber";
// React references expose each floating sprite group to the frame loop.
import { useEffect, useRef } from "react";
// Three.js supplies texture color management and the group and texture types.
import { SRGBColorSpace, type Group, type Texture } from "three";
// The pure layout and drift helper remain independent from React and rendering.
import {
  advanceCloudPosition,
  CLOUD_BANKS,
  type CloudBankDescription,
} from "./garden-clouds";
// The current light phase lets clouds inherit daytime, twilight, or moonlight color.
import type { GardenLightPhase } from "./uk-garden-time";

// The towering sprite provides fuller cumulus silhouettes.
const CUMULUS_TEXTURE_PATH = "/cloud-cumulus.png";
// The wider sprite provides lighter fair-weather variation.
const WISPY_TEXTURE_PATH = "/cloud-wispy.png";
// The first generated image is three units wide for every two units of height.
const CUMULUS_ASPECT_RATIO = 1.5;
// The second generated image uses a sixteen-by-nine transparent canvas.
const WISPY_ASPECT_RATIO = 16 / 9;

// Describe the changing atmosphere needed by the full cloud field.
type GardenCloudsProps = {
  // Phase tints the same natural textures without rebuilding the cloud layout.
  phase: GardenLightPhase;
};

// Describe the texture and atmospheric values required by one moving bank.
type FloatingCloudBankProps = {
  // Description contains its deterministic layout and motion settings.
  bank: CloudBankDescription;
  // Texture supplies a natural silhouette rather than repeated geometric lobes.
  texture: Texture;
  // Aspect ratio preserves the generated cloud without stretching it.
  aspectRatio: number;
  // Tint carries the current celestial phase into the photographic sprite.
  tint: string;
  // Opacity softens the cloud edge while keeping its body unmistakably visible.
  opacity: number;
};

// Move one natural cloud sprite continuously through the garden sky.
function FloatingCloudBank({
  bank,
  texture,
  aspectRatio,
  tint,
  opacity,
}: FloatingCloudBankProps) {
  // The group reference gives the frame loop mutable sky coordinates.
  const cloudRef = useRef<Group>(null);
  // Width derives from each bank's existing scale and configured cloud span.
  const width = bank.bounds[0] * bank.scale * 1.35;
  // Height preserves the original sprite proportions instead of squashing the cloud.
  const height = width / aspectRatio;

  // Update both wind drift and a quiet vertical breathing motion each frame.
  useFrame((state, delta) => {
    // A group can briefly be absent while the component mounts or unmounts.
    if (!cloudRef.current) return;
    // Frame delta makes horizontal motion independent of visitor frame rate.
    const windDistance = bank.driftSpeed * delta;
    // Wrapping remains hidden well outside the garden's fog horizon.
    cloudRef.current.position.x = advanceCloudPosition(
      cloudRef.current.position.x,
      windDistance,
    );
    // Different seed phases stop all five banks from rising and falling together.
    const floatPhase = state.clock.elapsedTime * 0.16 + bank.seed;
    // A small amplitude feels airborne without making the sky seasick.
    cloudRef.current.position.y =
      bank.position[1] + Math.sin(floatPhase) * 0.24;
  });

  // A Three.js sprite always faces the camera while its parent owns world motion.
  return (
    <group ref={cloudRef} position={bank.position}>
      {/* Preserve the generated silhouette and its feathered transparent boundary. */}
      <sprite scale={[width, height, 1]}>
        {/* A sprite material shows the authored cloud light without geometric seams. */}
        <spriteMaterial
          map={texture}
          color={tint}
          transparent
          opacity={opacity}
          alphaTest={0.01}
          depthWrite={false}
          toneMapped={false}
          fog
        />
      </sprite>
    </group>
  );
}

// Render varied, floating cloud silhouettes that follow the real-time light phase.
export function GardenClouds({ phase }: GardenCloudsProps) {
  // Load both local assets once and share their GPU textures across all five banks.
  const [cumulusTexture, wispyTexture] = useTexture([
    CUMULUS_TEXTURE_PATH,
    WISPY_TEXTURE_PATH,
  ]);

  // Mark authored image colors as sRGB so Three.js does not wash them out.
  useEffect(() => {
    // Both texture objects need the same color-space interpretation.
    [cumulusTexture, wispyTexture].forEach((texture) => {
      // This setting preserves the pearl whites and cool-grey underside.
      texture.colorSpace = SRGBColorSpace;
      // Request one GPU refresh after changing texture metadata.
      texture.needsUpdate = true;
    });
  }, [cumulusTexture, wispyTexture]);

  // Day stays neutral white while twilight and night borrow the sky palette.
  const cloudTint =
    phase === "day"
      ? "#ffffff"
      : phase === "night"
        ? "#8797b5"
        : phase === "dawn"
          ? "#f2d4c6"
          : "#e7bbb7";
  // Night clouds remain gentler so they do not compete with the Moon.
  const cloudOpacity = phase === "night" ? 0.72 : 0.92;

  // Stable descriptions preserve each cloud's identity as UK time updates.
  return (
    <>
      {/* Alternating assets prevent the skyline from repeating one silhouette. */}
      {CLOUD_BANKS.map((bank) => {
        // Odd seeds use the broad fair-weather cloud; even seeds use cumulus.
        const usesWispyTexture = bank.seed % 2 !== 0;
        // Select the corresponding image and its native proportions together.
        const texture = usesWispyTexture ? wispyTexture : cumulusTexture;
        const aspectRatio = usesWispyTexture
          ? WISPY_ASPECT_RATIO
          : CUMULUS_ASPECT_RATIO;
        // Render this independent cloud bank with the shared phase styling.
        return (
          <FloatingCloudBank
            key={bank.id}
            bank={bank}
            texture={texture}
            aspectRatio={aspectRatio}
            tint={cloudTint}
            opacity={cloudOpacity}
          />
        );
      })}
    </>
  );
}
