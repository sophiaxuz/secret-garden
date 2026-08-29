// GardenAnimals groups every moving inhabitant behind one scene interface.
import { GardenAnimals } from "./animals/GardenAnimals";
// GardenFlora owns flower generation, tree placement, and plant highlighting.
import { GardenFlora } from "./flora/GardenFlora";
// GardenShadowGroup applies one shadow policy to the whole physical world.
import { GardenShadowGroup } from "./lighting/GardenShadowGroup";
// GardenTerrain owns the island, coast, animated sea, and uninterrupted meadow.
import { GardenTerrain } from "./terrain/GardenTerrain";
// Terrain shares the same UK light snapshot already used by the sky and shadows.
import type { UkGardenTime } from "./lighting/uk-garden-time";
// Live weather lets the surrounding sea respond to current wind and rainfall.
import type { GardenWeather } from "./weather/garden-weather";

// Compose the three physical garden modules without owning feature implementation.
export function GardenWorld({
  plantedCount,
  targetedItemId,
  time,
  weather,
}: {
  // This number crosses the world seam into procedural flower generation.
  plantedCount: number;
  // This id crosses the world seam into flora and animal highlighting.
  targetedItemId: string | null;
  // Time provides Moon direction, phase, and intensity for water reflections.
  time: UkGardenTime;
  // Weather provides live wind, cloud, and rain controls for moving waves.
  weather: GardenWeather;
}) {
  // One untransformed group lets the cross-cutting shadow policy reach the world.
  return (
    <GardenShadowGroup refreshKey={plantedCount}>
      {/* Terrain establishes the island and surrounding sea beneath the world. */}
      <GardenTerrain time={time} weather={weather} />
      {/* Flora owns every initial, planted, or tree-shaped garden landmark. */}
      <GardenFlora
        plantedCount={plantedCount}
        targetedItemId={targetedItemId}
      />
      {/* Animals add independently animated, inspectable life to the world. */}
      <GardenAnimals targetedItemId={targetedItemId} lightPhase={time.phase} />
    </GardenShadowGroup>
  );
}
