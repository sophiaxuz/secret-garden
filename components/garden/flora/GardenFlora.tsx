// Shared weather lets every flexible flower respond to one real UK wind.
import type { GardenWeather } from "../weather/garden-weather";
// Flower hides procedural bloom geometry behind one small rendering interface.
import { Flower } from "./Flower";
// The high-capacity memory meadow batches visible surfaces across all planted flowers.
import { PlantedFlowerField } from "./flower/PlantedFlowerField";
// Initial flower placement and identity data stays beside its renderer.
import { INITIAL_FLOWERS } from "./garden-flowers";
// Tree placement and identity data stays beside its renderer as well.
import { GARDEN_TREES } from "./garden-trees";
// Tree hides trunk, canopy, highlighting, and interaction geometry.
import { Tree } from "./Tree";

// Render every flower and tree through one flora-focused scene interface.
export function GardenFlora({
  plantedCount,
  targetedItemId,
  weather,
}: {
  // This number determines how many new memory flowers are generated.
  plantedCount: number;
  // This id lets the targeted flower or tree render its glow.
  targetedItemId: string | null;
  // Wind joins procedural flowers to the same atmosphere as grass, rain, and sea.
  weather: Pick<GardenWeather, "windSpeedKph" | "windDirectionDegrees">;
}) {
  // A fragment groups flora without adding an unnecessary transform node.
  return (
    <>
      {/* Convert each named initial-flower object into a Flower module instance. */}
      {INITIAL_FLOWERS.map(
        ({ position, color, scale, petals, layers, archetype, memory }) => (
          <Flower
            key={memory.id}
            position={position}
            color={color}
            memory={memory}
            // Only the flower beneath the reticle should glow.
            highlighted={targetedItemId === memory.id}
            scale={scale}
            petals={petals}
            layers={layers}
            archetype={archetype}
            atmosphere={weather}
          />
        ),
      )}
      {/* Batch visitor-created flower surfaces while retaining individual inspection. */}
      <PlantedFlowerField
        plantedCount={plantedCount}
        targetedItemId={targetedItemId}
        atmosphere={weather}
      />
      {/* Render the named trees around the expanded walkable area. */}
      {GARDEN_TREES.map(({ position, scale, item, visual }) => (
        <Tree
          key={item.id}
          position={position}
          scale={scale}
          item={item}
          visual={visual}
          // Give the nearest targeted tree a soft canopy glow.
          highlighted={targetedItemId === item.id}
        />
      ))}
    </>
  );
}
