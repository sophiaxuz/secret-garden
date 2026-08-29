// These conditions are the small vocabulary the visual garden understands.
export type GardenWeatherCondition =
  "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";

// This snapshot is the complete weather interface consumed by React and Three.js.
export type GardenWeather = {
  // Condition selects the broad family of environmental effects.
  condition: GardenWeatherCondition;
  // Label gives visitors a human-readable current observation.
  label: string;
  // Rain intensity is normalized so rendering never depends on millimetre units.
  rainIntensity: number;
  // Cloud cover controls how many authored cloud banks appear.
  cloudCover: number;
  // Temperature is nullable because a malformed service response may omit it.
  temperatureC: number | null;
  // Wind values move rainfall in the same direction as the live observation.
  windSpeedKph: number;
  windDirectionDegrees: number;
  // The observation time makes staleness inspectable during development.
  observedAt: string | null;
  // Live distinguishes a real observation from the safe local fallback.
  live: boolean;
};

// A calm fallback keeps the garden available during a weather-service outage.
export const FALLBACK_GARDEN_WEATHER: GardenWeather = {
  condition: "clear",
  label: "weather resting",
  rainIntensity: 0,
  cloudCover: 28,
  temperatureC: null,
  windSpeedKph: 6,
  windDirectionDegrees: 240,
  observedAt: null,
  live: false,
};

// Keep a numeric value inside inclusive limits.
function clamp(value: number, minimum: number, maximum: number): number {
  // Nested min and max calls avoid adding a renderer dependency to this seam.
  return Math.min(maximum, Math.max(minimum, value));
}

// Read one finite numeric field without trusting an external JSON payload.
function readNumber(value: unknown, fallback: number): number {
  // Only real finite numbers may enter the visual weather model.
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

// Translate a WMO weather code into the garden's compact condition family.
function getCondition(code: number): GardenWeatherCondition {
  // Thunderstorm codes take precedence over their accompanying rainfall.
  if (code >= 95) return "storm";
  // Snow and snow-shower codes share one winter presentation family.
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  // Drizzle, rain, freezing rain, and rain showers all make the garden wet.
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  // WMO 45 and 48 describe fog and depositing rime fog.
  if (code === 45 || code === 48) return "fog";
  // Codes one through three move from mainly clear to overcast.
  if (code >= 1 && code <= 3) return "cloudy";
  // Code zero and unknown low codes remain visually calm.
  return "clear";
}

// Provide quiet natural-language labels without exposing numerical WMO codes.
function getWeatherLabel(code: number): string {
  // The most visually important severities receive explicit names.
  if (code === 0) return "clear sky";
  if (code === 1) return "mainly clear";
  if (code === 2) return "partly cloudy";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "mist and fog";
  if (code === 51 || code === 53) return "light drizzle";
  if (code === 55 || code === 56 || code === 57) return "heavy drizzle";
  if (code === 61) return "light rain";
  if (code === 63 || code === 66) return "rain";
  if (code === 65 || code === 67) return "heavy rain";
  if (code >= 71 && code <= 77) return code === 75 ? "heavy snow" : "snow";
  if (code === 80) return "light showers";
  if (code === 81) return "rain showers";
  if (code === 82) return "heavy showers";
  if (code === 85 || code === 86) return "snow showers";
  if (code >= 95) return "thunderstorm";
  // Unknown future codes stay readable without pretending to be precise.
  return "changing weather";
}

// Convert rain codes and measured precipitation into a normalized visual strength.
function getRainIntensity(
  code: number,
  precipitation: number,
  rain: number,
  showers: number,
): number {
  // WMO severity provides a baseline even when the hourly amount rounds to zero.
  const codedStrength =
    code === 51 || code === 61 || code === 80
      ? 0.28
      : code === 53 || code === 63 || code === 66 || code === 81
        ? 0.58
        : code === 55 || code === 56 || code === 57
          ? 0.46
          : code === 65 || code === 67 || code === 82
            ? 0.9
            : code >= 95
              ? 0.82
              : 0;
  // The greatest reported wet amount prevents double-counting overlapping fields.
  const measuredWetness = Math.max(precipitation, rain + showers);
  // Four millimetres per hour already reads as visually heavy garden rain.
  const measuredStrength = clamp(measuredWetness / 4, 0, 1);
  // Use whichever signal is stronger and keep the renderer within zero to one.
  return clamp(Math.max(codedStrength, measuredStrength), 0, 1);
}

// Convert the documented Open-Meteo current object into a safe garden snapshot.
export function mapOpenMeteoWeather(payload: unknown): GardenWeather {
  // External JSON must be narrowed before any field is read.
  if (typeof payload !== "object" || payload === null) {
    return FALLBACK_GARDEN_WEATHER;
  }
  // Current contains the instant values requested by the server route.
  const current = (payload as { current?: unknown }).current;
  // Missing current data means the service did not supply a usable observation.
  if (typeof current !== "object" || current === null) {
    return FALLBACK_GARDEN_WEATHER;
  }
  // A weather code is required because it selects every broad visual condition.
  const rawCode = (current as Record<string, unknown>).weather_code;
  if (typeof rawCode !== "number" || !Number.isFinite(rawCode)) {
    return FALLBACK_GARDEN_WEATHER;
  }
  // Reuse one narrowed record for all remaining optional numeric fields.
  const values = current as Record<string, unknown>;
  // Resolve the broad condition once so snow cannot accidentally render as rain.
  const condition = getCondition(rawCode);
  const precipitation = readNumber(values.precipitation, 0);
  const rain = readNumber(values.rain, 0);
  const showers = readNumber(values.showers, 0);
  // Temperature remains null when absent instead of showing a fabricated zero.
  const temperature = readNumber(values.temperature_2m, Number.NaN);
  // Assemble the stable interface consumed by the live garden.
  return {
    condition,
    label: getWeatherLabel(rawCode),
    rainIntensity:
      condition === "rain" || condition === "storm"
        ? getRainIntensity(rawCode, precipitation, rain, showers)
        : 0,
    cloudCover: clamp(readNumber(values.cloud_cover, 28), 0, 100),
    temperatureC: Number.isFinite(temperature) ? temperature : null,
    windSpeedKph: clamp(readNumber(values.wind_speed_10m, 6), 0, 180),
    windDirectionDegrees: clamp(
      readNumber(values.wind_direction_10m, 240),
      0,
      360,
    ),
    observedAt: typeof values.time === "string" ? values.time : null,
    live: true,
  };
}

// Validate the project's own API response before storing it in client state.
export function isGardenWeather(value: unknown): value is GardenWeather {
  // A few discriminating fields are sufficient because the server owns the schema.
  if (typeof value !== "object" || value === null) return false;
  const weather = value as Partial<GardenWeather>;
  return (
    typeof weather.label === "string" &&
    typeof weather.rainIntensity === "number" &&
    typeof weather.cloudCover === "number" &&
    typeof weather.windSpeedKph === "number" &&
    typeof weather.windDirectionDegrees === "number" &&
    typeof weather.live === "boolean"
  );
}
