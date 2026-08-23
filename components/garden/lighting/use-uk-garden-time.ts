// React state and effects keep the rendered sky synchronized with the wall clock.
import { useEffect, useState } from "react";
// The pure calculation translates an instant into UK-local garden lighting.
import { getUkGardenTime } from "./uk-garden-time";

// Recalculate the garden sky once per second and clean up when it unmounts.
export function useUkGardenTime() {
  // Initialize from the browser's current instant on the first client render.
  const [gardenTime, setGardenTime] = useState(() =>
    getUkGardenTime(new Date()),
  );

  // Start the live clock after React attaches the component to the page.
  useEffect(() => {
    // Refresh immediately in case hydration took a noticeable amount of time.
    setGardenTime(getUkGardenTime(new Date()));
    // A one-second interval keeps the visible seconds and lighting state current.
    const intervalId = window.setInterval(() => {
      // Use a fresh instant instead of accumulating timer drift.
      setGardenTime(getUkGardenTime(new Date()));
    }, 1_000);
    // Stop the timer if the garden leaves the page.
    return () => window.clearInterval(intervalId);
  }, []);

  // Give the scene and its HTML clock the exact same time snapshot.
  return gardenTime;
}
