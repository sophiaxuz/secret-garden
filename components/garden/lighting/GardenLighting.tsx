// Drei's atmospheric shader makes the sky respond to the calculated Sun.
import { Sky } from "@react-three/drei";
// Fiber exposes the renderer so exposure can follow the same live daylight value.
import { useThree } from "@react-three/fiber";
// React updates exposure before paint and remembers the renderer's original state.
import { useEffect, useLayoutEffect, useRef } from "react";
// The lighting component consumes the pure UK time calculation as its interface.
import type { CelestialPosition, UkGardenTime } from "./uk-garden-time";
// GardenClouds adds slow, light-responsive movement beneath the sky dome.
import { GardenClouds } from "./GardenClouds";
// GardenSun renders a soft solar disc and atmospheric corona at the real position.
import { GardenSun } from "./GardenSun";

// Describe the one synchronized snapshot needed by the whole atmosphere.
type GardenLightingProps = {
  // Time contains positions, intensities, and colors calculated outside React.
  time: UkGardenTime;
};

// Shared shadow bounds cover the explorable garden without wasting map detail.
const SHADOW_BOUNDARY = 28;

// Describe the values that differ between the Sun and Moon directional lights.
type CelestialLightProps = {
  // Position determines the direction from which shadows fall across the garden.
  position: CelestialPosition;
  // Intensity fades each light naturally near its horizon.
  intensity: number;
  // Color separates warm sunlight from cool moonlight.
  color: string;
  // Only the currently dominant light should render a shadow map.
  castShadow: boolean;
};

// Keep the shared soft-shadow configuration in one reusable celestial light.
function CelestialLight({
  position,
  intensity,
  color,
  castShadow,
}: CelestialLightProps) {
  // The same bounded shadow camera serves both the daytime and nighttime light.
  return (
    <directionalLight
      position={position}
      intensity={intensity}
      color={color}
      castShadow={castShadow}
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-near={0.5}
      shadow-camera-far={120}
      shadow-camera-left={-SHADOW_BOUNDARY}
      shadow-camera-right={SHADOW_BOUNDARY}
      shadow-camera-top={SHADOW_BOUNDARY}
      shadow-camera-bottom={-SHADOW_BOUNDARY}
      shadow-bias={-0.0004}
      shadow-normalBias={0.035}
    />
  );
}

// Render a Sun by day, a Moon by night, and continuous twilight between them.
export function GardenLighting({ time }: GardenLightingProps) {
  // Access the existing Canvas renderer rather than creating another WebGL context.
  const renderer = useThree((state) => state.gl);
  // Capture the pre-garden exposure so unmounting cannot leak renderer state.
  const originalExposure = useRef(renderer.toneMappingExposure);
  // Apply the calculated real-time exposure whenever daylight strength changes.
  useLayoutEffect(() => {
    // ACES keeps bright sunlight filmic while preserving colour in the highlights.
    renderer.toneMappingExposure = time.rendererExposure;
  }, [renderer, time.rendererExposure]);
  // Restore the renderer if this atmosphere is ever removed before its Canvas.
  useEffect(() => {
    // Copy the initial value so cleanup does not depend on a later ref mutation.
    const exposureBeforeGarden = originalExposure.current;
    // Cleanup returns ownership of exposure to whichever scene mounted the garden.
    return () => {
      renderer.toneMappingExposure = exposureBeforeGarden;
    };
  }, [renderer]);
  // Only the dominant celestial light needs an expensive shadow map at once.
  const sunCastsShadow =
    time.sunIntensity >= time.moonIntensity && time.sunIntensity > 0.03;
  // The Moon takes over shadow casting after the Sun has gone below the horizon.
  const moonCastsShadow =
    time.moonIntensity > time.sunIntensity && time.moonIntensity > 0.03;

  // Every atmospheric element reads from one UK-time snapshot.
  return (
    <>
      {/* The clear color fills any pixels outside the atmospheric dome. */}
      <color attach="background" args={[time.skyColor]} />
      {/* Matching fog blends distant trees into the current horizon. */}
      <fog attach="fog" args={[time.fogColor, 24, 58]} />
      {/* The shader follows London's real solar path through the day and year. */}
      <Sky
        distance={450000}
        sunPosition={time.sunPosition}
        turbidity={time.phase === "day" ? 4.2 : 10}
        rayleigh={time.phase === "day" ? 1.7 : 1.1}
        mieCoefficient={time.phase === "day" ? 0.004 : 0.007}
        mieDirectionalG={0.82}
      />
      {/* Let broad cloud banks drift through the current UK light phase. */}
      <GardenClouds phase={time.phase} />
      {/* Ambient sky light keeps shaded surfaces legible without flattening them. */}
      <hemisphereLight
        intensity={time.hemisphereIntensity}
        color={time.hemisphereColor}
        groundColor={time.hemisphereGroundColor}
      />
      {/* This directional source produces warm, moving daytime shadows. */}
      <CelestialLight
        position={time.sunPosition}
        intensity={time.sunIntensity}
        color={time.sunColor}
        castShadow={sunCastsShadow}
      />
      {/* This cooler directional source gives moonlit nights their own shadows. */}
      <CelestialLight
        position={time.moonPosition}
        intensity={time.moonIntensity}
        color="#b9d4ff"
        castShadow={moonCastsShadow}
      />
      {/* A fine solar disc and feathered corona replace the former flat sphere. */}
      {time.sunPosition[1] > -1 && (
        <GardenSun
          position={time.sunPosition}
          color={time.sunColor}
          intensity={time.sunIntensity}
        />
      )}
      {/* The opposing pale sphere becomes visible as night reaches the garden. */}
      <mesh position={time.moonPosition} visible={time.moonPosition[1] > -1}>
        <sphereGeometry args={[1.15, 24, 24]} />
        <meshBasicMaterial color="#dce7f3" fog={false} />
      </mesh>
    </>
  );
}
