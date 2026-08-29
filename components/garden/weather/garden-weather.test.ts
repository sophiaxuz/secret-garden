// Vitest protects the weather-to-garden translation without calling the network.
import { expect, test } from "vitest";
// The mapper is the seam between Open-Meteo data and the visual garden language.
import { mapOpenMeteoWeather } from "./garden-weather";

// Heavy rain should produce an unmistakable wet garden rather than a vague cloud.
test("Open-Meteo heavy rain becomes a strong rainy garden", () => {
  // This fixture mirrors the documented current-weather response fields.
  const weather = mapOpenMeteoWeather({
    current: {
      time: "2026-08-29T16:30",
      temperature_2m: 17.4,
      weather_code: 65,
      precipitation: 5.2,
      rain: 4.8,
      showers: 0.4,
      snowfall: 0,
      cloud_cover: 96,
      wind_speed_10m: 22,
      wind_direction_10m: 245,
    },
  });
  // Visitors should both see a truthful label and receive a strong rain effect.
  expect(weather.condition).toBe("rain");
  expect(weather.label).toBe("heavy rain");
  expect(weather.rainIntensity).toBeGreaterThanOrEqual(0.85);
  expect(weather.cloudCover).toBe(96);
  expect(weather.live).toBe(true);
});

// Invalid network data must leave a usable calm garden instead of crashing WebGL.
test("malformed weather data falls back safely", () => {
  // An empty payload represents an upstream or schema failure.
  const weather = mapOpenMeteoWeather({});
  // The fallback is explicit to the UI but visually calm and deterministic.
  expect(weather.live).toBe(false);
  expect(weather.rainIntensity).toBe(0);
  expect(weather.condition).toBe("clear");
});

// Snowfall has precipitation water content but must not become liquid rain visually.
test("snow observations do not activate rain streaks", () => {
  // WMO 75 is heavy snow with a non-zero total precipitation measurement.
  const weather = mapOpenMeteoWeather({
    current: { weather_code: 75, precipitation: 3.5, snowfall: 2 },
  });
  // A later snow renderer can use the condition without displaying wrong rain today.
  expect(weather.condition).toBe("snow");
  expect(weather.rainIntensity).toBe(0);
});
