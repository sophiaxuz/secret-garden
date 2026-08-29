// NextResponse creates a typed JSON boundary between Open-Meteo and the browser.
import { NextResponse } from "next/server";
// The pure mapper validates external data before it reaches the garden renderer.
import {
  FALLBACK_GARDEN_WEATHER,
  mapOpenMeteoWeather,
} from "@/components/garden/weather/garden-weather";

// London matches the geographic anchor already used by the UK Sun and clock.
const LONDON_LATITUDE = "51.5074";
const LONDON_LONGITUDE = "-0.1278";
// Server and browser caches share the same ten-minute observation lifetime.
const WEATHER_CACHE_SECONDS = 600;

// Build the provider URL explicitly so every requested field remains reviewable.
function getWeatherUrl(): string {
  // URLSearchParams handles encoding the timezone and comma-separated field list.
  const parameters = new URLSearchParams({
    latitude: LONDON_LATITUDE,
    longitude: LONDON_LONGITUDE,
    current:
      "temperature_2m,weather_code,precipitation,rain,showers,snowfall,cloud_cover,wind_speed_10m,wind_direction_10m",
    timezone: "Europe/London",
  });
  // Open-Meteo exposes current forecast-model observations at this endpoint.
  return `https://api.open-meteo.com/v1/forecast?${parameters.toString()}`;
}

// Return the latest London atmosphere without exposing a provider call to clients.
export async function GET() {
  try {
    // Next reuses this provider response for ten minutes across garden visitors.
    const response = await fetch(getWeatherUrl(), {
      headers: { Accept: "application/json" },
      next: { revalidate: WEATHER_CACHE_SECONDS },
    });
    // Non-success status codes are not valid weather observations.
    if (!response.ok)
      throw new Error(`Weather provider returned ${response.status}`);
    // Keep provider JSON unknown until the domain mapper validates its fields.
    const payload: unknown = await response.json();
    // Serialize only the small stable snapshot understood by the client.
    return NextResponse.json(mapOpenMeteoWeather(payload), {
      headers: {
        "Cache-Control": `public, s-maxage=${WEATHER_CACHE_SECONDS}, stale-while-revalidate=300`,
      },
    });
  } catch {
    // A calm response preserves availability while clearly marking itself non-live.
    return NextResponse.json(FALLBACK_GARDEN_WEATHER, {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
