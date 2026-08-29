// Vitest replaces the provider call while exercising the real Next.js route.
import { afterEach, expect, test, vi } from "vitest";
// GET is the complete server boundary used by browser weather refreshes.
import { GET } from "./route";

// Restore the global provider substitute after each focused route test.
afterEach(() => vi.unstubAllGlobals());

// Protect the live route fields and project-owned response shape together.
test("the weather route requests and returns current London rain", async () => {
  // Supply one documented Open-Meteo current-conditions payload.
  const providerFetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        current: {
          time: "2026-08-29T16:30",
          temperature_2m: 16,
          weather_code: 63,
          precipitation: 1.4,
          rain: 1.4,
          showers: 0,
          cloud_cover: 88,
          wind_speed_10m: 18,
          wind_direction_10m: 230,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );
  // Install the provider substitute where the route reads server fetch.
  vi.stubGlobal("fetch", providerFetch);
  // Execute the same route called by the live client hook.
  const response = await GET();
  const weather = await response.json();
  // The URL must remain geographically aligned with the London garden clock.
  expect(providerFetch).toHaveBeenCalledOnce();
  expect(String(providerFetch.mock.calls[0][0])).toContain("latitude=51.5074");
  expect(String(providerFetch.mock.calls[0][0])).toContain("weather_code");
  // The browser receives the narrow domain shape rather than provider internals.
  expect(weather.condition).toBe("rain");
  expect(weather.label).toBe("rain");
  expect(weather.live).toBe(true);
});
