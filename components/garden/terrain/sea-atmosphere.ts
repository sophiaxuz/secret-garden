// The sea consumes only the celestial fields needed for color and moon reflection.
import type { UkGardenTime } from "../lighting/uk-garden-time";
// Live weather supplies wind, rain, and cloud attenuation for the water surface.
import type { GardenWeather } from "../weather/garden-weather";

// This compact snapshot is the complete non-renderer interface used by Sea.
export type SeaAtmosphere = {
  // Water color follows the broad light phase before Three applies live lighting.
  waterColor: string;
  // A normalized world direction points from the sea toward the visible Moon.
  moonDirection: readonly [number, number, number];
  // Reflection intensity already includes horizon, phase, and cloud visibility.
  moonReflectionIntensity: number;
  // Wave energy scales displacement and normals under stronger weather.
  waveEnergy: number;
  // Wave speed lets live wind change motion without creating frame-rate coupling.
  waveSpeed: number;
  // Horizontal wind direction turns wave families across the water surface.
  windDirection: readonly [number, number];
};

// Keep a numeric environmental input inside an intentionally authored range.
function clamp(value: number, minimum: number, maximum: number): number {
  // Nested bounds prevent extreme observations from destabilizing the shader.
  return Math.min(maximum, Math.max(minimum, value));
}

// Translate shared UK light and weather into stable artistic sea controls.
export function getSeaAtmosphere(
  time: Pick<UkGardenTime, "phase" | "moonPosition" | "moonIntensity">,
  weather: Pick<
    GardenWeather,
    "cloudCover" | "rainIntensity" | "windSpeedKph" | "windDirectionDegrees"
  >,
): SeaAtmosphere {
  // Normalize the celestial position because distance should not alter brightness.
  const moonLength = Math.max(0.001, Math.hypot(...time.moonPosition));
  // Preserve Three's X/Y/Z order in the renderer-independent tuple.
  const moonDirection = time.moonPosition.map(
    (coordinate) => coordinate / moonLength,
  ) as [number, number, number];
  // Reflection fades gently while the Moon is still touching the horizon.
  const horizonVisibility = clamp(moonDirection[1] * 7, 0, 1);
  // Day suppresses the silver path while twilight permits only a faint trace.
  const phaseVisibility =
    time.phase === "night" ? 1 : time.phase === "day" ? 0 : 0.28;
  // Thick cloud may veil the Moon almost completely without making water lifeless.
  const cloudVisibility = clamp(1 - weather.cloudCover / 105, 0.06, 1);
  // The final authored multiplier makes the path legible beside the bright sky dome.
  const moonReflectionIntensity = clamp(
    time.moonIntensity *
      horizonVisibility *
      phaseVisibility *
      cloudVisibility *
      3.6,
    0,
    1.35,
  );
  // Wind creates broad energy while rainfall adds smaller surface disturbance.
  const waveEnergy = clamp(
    0.9 + weather.windSpeedKph / 38 + weather.rainIntensity * 0.38,
    0.9,
    1.75,
  );
  // Speed changes more conservatively so storms feel active rather than frantic.
  const waveSpeed = clamp(0.82 + weather.windSpeedKph / 42, 0.82, 1.55);
  // Convert meteorological degrees into the sea plane's horizontal vector.
  const windRadians = (weather.windDirectionDegrees * Math.PI) / 180;
  // Sine controls east-west X while cosine controls the local depth axis.
  const windDirection = [Math.sin(windRadians), Math.cos(windRadians)] as const;
  // Base pigment shifts from luminous daytime teal to deep nocturnal blue.
  const waterColor =
    time.phase === "night"
      ? "#173d58"
      : time.phase === "day"
        ? "#3f8994"
        : "#345f70";

  // Return one complete immutable snapshot for both material and GPU uniforms.
  return {
    waterColor,
    moonDirection,
    moonReflectionIntensity,
    waveEnergy,
    waveSpeed,
    windDirection,
  };
}
