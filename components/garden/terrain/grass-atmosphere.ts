// Live weather supplies only the observations that physically affect a meadow.
import type { GardenWeather } from "../weather/garden-weather";

// This compact renderer-independent snapshot is the complete grass shader input.
export type GrassAtmosphere = {
  // Sway strength controls broad tip displacement in world units.
  swayStrength: number;
  // Gust speed controls how quickly broad wind bands cross the field.
  gustSpeed: number;
  // Flutter strength adds fine independent motion near blade tips.
  flutterStrength: number;
  // The normalized horizontal vector preserves meteorological wind direction.
  windDirection: readonly [number, number];
};

// Keep changing observations inside intentionally authored visual limits.
function clamp(value: number, minimum: number, maximum: number): number {
  // Nested bounds prevent extreme forecasts destabilizing the vertex shader.
  return Math.min(maximum, Math.max(minimum, value));
}

// Translate live London weather into subtle, physically coherent meadow motion.
export function getGrassAtmosphere(
  weather: Pick<
    GardenWeather,
    "windSpeedKph" | "windDirectionDegrees" | "rainIntensity"
  >,
): GrassAtmosphere {
  // Wind creates broad lean while rain adds only a restrained extra weight.
  const swayStrength = clamp(
    0.035 + weather.windSpeedKph / 220 + weather.rainIntensity * 0.05,
    0.035,
    0.24,
  );
  // Faster weather moves gusts more quickly without making them flicker.
  const gustSpeed = clamp(
    0.42 + weather.windSpeedKph / 30 + weather.rainIntensity * 0.18,
    0.42,
    1.8,
  );
  // Short capillary-like flutter remains much smaller than the complete sway.
  const flutterStrength = clamp(
    0.012 + weather.windSpeedKph / 900 + weather.rainIntensity * 0.018,
    0.012,
    0.07,
  );
  // Convert clockwise meteorological degrees into the garden's X/Z plane.
  const directionRadians = (weather.windDirectionDegrees * Math.PI) / 180;
  // Negation turns the reported origin bearing into the direction wind travels.
  const windDirection = [
    -Math.sin(directionRadians),
    -Math.cos(directionRadians),
  ] as const;
  // Return one immutable atmosphere read by both setup and the frame loop.
  return { swayStrength, gustSpeed, flutterStrength, windDirection };
}
