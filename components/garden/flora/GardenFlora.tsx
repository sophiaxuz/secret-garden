// Shared dimensions define the finite set of visitor-created flower plots.
import { GARDEN_LAYOUT } from "../garden-layout";
// Flower hides procedural bloom geometry behind one small rendering interface.
import { Flower } from "./Flower";
// Initial flower placement and identity data stays beside its renderer.
import { INITIAL_FLOWERS } from "./garden-flowers";
// The pure layout seam spreads future planted memories across the wider meadow.
import { getPlantedFlowerPosition } from "./garden-flower-layout";
// Tree placement and identity data stays beside its renderer as well.
import { GARDEN_TREES } from "./garden-trees";
// Tree hides trunk, canopy, highlighting, and interaction geometry.
import { Tree } from "./Tree";

// Render every flower and tree through one flora-focused scene interface.
export function GardenFlora({
  plantedCount,
  targetedItemId,
}: {
  // This number determines how many new memory flowers are generated.
  plantedCount: number;
  // This id lets the targeted flower or tree render its glow.
  targetedItemId: string | null;
}) {
  // A fragment groups flora without adding an unnecessary transform node.
  return (
    <>
      {/* Convert each named initial-flower object into a Flower module instance. */}
      {INITIAL_FLOWERS.map(
        ({ position, color, scale, petals, layers, bell, memory }) => (
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
            bell={bell}
          />
        ),
      )}
      {/* Create additional flowers from the visitor's in-memory planting count. */}
      {Array.from(
        // Stop at the number of unique plots so flowers never repeat in one spot.
        {
          length: Math.min(plantedCount, GARDEN_LAYOUT.plantedFlowers.capacity),
        },
        (_, index) => (
          <Flower
            // Prefixing the key distinguishes planted flowers from initial flowers.
            key={`new-${index}`}
            // Plant paired rows across several plots inside the garden bounds.
            position={getPlantedFlowerPosition(index)}
            // Cycle through a small warm color palette.
            color={["#e4a85e", "#b48fb8", "#efd082"][index % 3]}
            // Until Pl@ntNet is connected, new memories remain honestly unidentified.
            memory={{
              id: `memory-${index}`,
              name: "Unidentified memory",
              note: "Waiting to be identified, but already part of your garden.",
            }}
            highlighted={targetedItemId === `memory-${index}`}
            // Small size and petal variations make each memory slightly different.
            scale={0.7 + (index % 2) * 0.15}
            petals={7 + (index % 3)}
          />
        ),
      )}
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
