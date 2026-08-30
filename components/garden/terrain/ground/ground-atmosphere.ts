// Shared UK time supplies season and broad environmental illumination.
import type { UkGardenTime } from "../../lighting/uk-garden-time";
// Shared weather supplies current precipitation without coupling to the API route.
import type { GardenWeather } from "../../weather/garden-weather";

// This renderer-independent snapshot is the complete ground-material input.
export type GroundAtmosphere = {
  // Wetness controls darkening, subtle highlights, and richer moss pigment.
  wetness: number;
  // Roughness remains organic even when rain softens the driest matte response.
  roughness: number;
  // The multiplier darkens every albedo layer coherently after rainfall.
  colorMultiplier: number;
  // Seasonal warmth gently shifts dry fibers without recolouring the whole meadow.
  seasonalWarmth: number;
  // Low-light coolness prevents the surface from becoming black at night.
  nightCoolness: number;
};

// Keep live external observations inside intentionally authored visual limits.
function clamp(value: number, minimum: number, maximum: number): number {
  // Nested bounds keep future extreme forecasts safe for material interpolation.
  return Math.min(maximum, Math.max(minimum, value));
}

// Translate real UK time and weather into stable natural ground-material controls.
export function getGroundAtmosphere(
  time: Pick<UkGardenTime, "phase" | "season" | "environmentIntensity">,
  weather: Pick<GardenWeather, "condition" | "rainIntensity">,
): GroundAtmosphere {
  // Rain conditions retain a faint damp baseline between measured shower pulses.
  const weatherDampness =
    weather.condition === "rain" || weather.condition === "storm" ? 0.08 : 0;
  // A trace of moisture keeps moss velvety even during completely dry observations.
  const wetness = clamp(
    0.02 + weatherDampness + weather.rainIntensity * 0.92,
    0.02,
    1,
  );
  // Organic soil stays broadly rough while wet areas gain restrained soft highlights.
  const roughness = clamp(0.97 - wetness * 0.27, 0.68, 0.97);
  // Saturated loam and moss absorb more light rather than becoming uniformly glossy.
  const colorMultiplier = clamp(1 - wetness * 0.2, 0.79, 1);
  // Summer and autumn introduce warmth; winter remains slightly cooler and quieter.
  const seasonalWarmth =
    time.season === "autumn"
      ? 0.16
      : time.season === "summer"
        ? 0.07
        : time.season === "spring"
          ? 0.025
          : -0.035;
  // Night colour cooling eases with actual environmental light instead of switching.
  const phaseCoolness = time.phase === "night" ? 0.12 : 0;
  // Environment intensity preserves a smaller transition through dawn and dusk.
  const nightCoolness = clamp(
    phaseCoolness + (1 - time.environmentIntensity) * 0.045,
    0,
    0.16,
  );
  // Return one compact atmosphere shared by React material props and the shader.
  return {
    wetness,
    roughness,
    colorMultiplier,
    seasonalWarmth,
    nightCoolness,
  };
}
