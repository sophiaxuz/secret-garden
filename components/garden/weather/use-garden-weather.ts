// React effects refresh real weather while state keeps the latest safe snapshot.
import { useEffect, useState } from "react";
// The domain seam supplies validation, fallback behavior, and the public type.
import {
  FALLBACK_GARDEN_WEATHER,
  isGardenWeather,
  type GardenWeather,
} from "./garden-weather";

// Ten minutes respects forecast cadence without leaving a long-running visit stale.
const WEATHER_REFRESH_MILLISECONDS = 10 * 60 * 1_000;

// Keep one live London weather snapshot synchronized with the browser visit.
export function useGardenWeather(): GardenWeather {
  // Begin calmly so network latency never blocks entry into the garden.
  const [weather, setWeather] = useState(FALLBACK_GARDEN_WEATHER);

  // Fetch immediately and refresh at a restrained observation interval.
  useEffect(() => {
    // Active prevents a late response updating an unmounted garden.
    let active = true;
    // Load through the local route so provider details stay outside components.
    async function refreshWeather() {
      try {
        // No-store asks the browser for the route's latest server-cached observation.
        const response = await fetch("/api/weather", { cache: "no-store" });
        // A failed route leaves the last successful snapshot undisturbed.
        if (!response.ok) return;
        // JSON remains unknown until the project-owned schema guard accepts it.
        const nextWeather: unknown = await response.json();
        if (active && isGardenWeather(nextWeather)) setWeather(nextWeather);
      } catch {
        // Weather is atmosphere, not an availability dependency for the garden.
      }
    }
    // Start the first request as soon as the client garden mounts.
    void refreshWeather();
    // Recheck during long visits without polling every clock tick.
    const refreshInterval = window.setInterval(
      refreshWeather,
      WEATHER_REFRESH_MILLISECONDS,
    );
    // Stop both interval work and state updates when the garden unmounts.
    return () => {
      active = false;
      window.clearInterval(refreshInterval);
    };
  }, []);

  // Consumers receive one complete snapshot regardless of network state.
  return weather;
}
