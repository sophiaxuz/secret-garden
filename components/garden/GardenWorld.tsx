// Flower and Tree hide the geometry details behind small reusable interfaces.
import { Flower } from "./flower/Flower";
// Grass hides hundreds of repeated blades behind one instanced-mesh interface.
import { Grass } from "./Grass";
// Initial flower data lives separately from the scene's rendering logic.
import { INITIAL_FLOWERS } from "./garden-flowers";
// Shared dimensions keep ground, path, grass, and camera limits aligned.
import { GARDEN_LAYOUT } from "./garden-layout";
// Tree placement and inspectable identities live together in one data module.
import { GARDEN_TREES } from "./garden-trees";
import { Tree } from "./Tree";
// Nature groups the butterflies, robin, and squirrel in one scene module.
import { Nature } from "./nature/Nature";

// Find a planted flower's place in several spacious plots beside the path.
function getPlantedFlowerPosition(index: number): [number, number, number] {
  // Two consecutive flowers share a row on opposite sides of the path.
  const pairIndex = Math.floor(index / 2);
  // Ten rows fill the garden from its entrance toward its deeper edge.
  const row = pairIndex % GARDEN_LAYOUT.plantedFlowers.rows;
  // Later flowers move into additional columns instead of leaving the bounds.
  const column =
    Math.floor(pairIndex / GARDEN_LAYOUT.plantedFlowers.rows) %
    GARDEN_LAYOUT.plantedFlowers.columns;
  // Alternate the sign to place one flower on each side of the path.
  const side = index % GARDEN_LAYOUT.plantedFlowers.sides ? 1 : -1;
  // Return a position that remains inside the shared walkable garden limits.
  return [side * (3.4 + column * 2.3), 0, 8.5 - row * 3.2];
}

// This module composes all physical objects that occupy the garden.
export function GardenWorld({
  plantedCount,
  targetedItemId,
}: {
  // This number determines how many new memory flowers are generated.
  plantedCount: number;
  // This id lets the targeted flower, tree, or animal render its glow.
  targetedItemId: string | null;
}) {
  // A fragment groups scene objects without creating an extra Three.js group.
  return (
    <>
      {/* Rotate a large plane flat to create the garden floor. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        {/* The plane spans beyond the fog, so visitors never see its edge. */}
        <planeGeometry
          args={[GARDEN_LAYOUT.groundWidth, GARDEN_LAYOUT.groundDepth, 1, 1]}
        />
        {/* High roughness makes the ground diffuse rather than reflective. */}
        <meshStandardMaterial color="#3f593b" roughness={1} />
      </mesh>
      {/* A narrower plane sits slightly above the ground as a path. */}
      <mesh
        position={[0, 0.012, GARDEN_LAYOUT.pathCenterZ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry
          args={[GARDEN_LAYOUT.pathWidth, GARDEN_LAYOUT.pathLength]}
        />
        <meshStandardMaterial color="#70654b" roughness={1} />
      </mesh>
      {/* Render every deterministic grass blade through one GPU-instanced mesh. */}
      <Grass />
      {/* Convert each named initial-flower object into a Flower module instance. */}
      {INITIAL_FLOWERS.map(
        ({ position, color, scale, petals, bell, memory }) => (
          <Flower
            key={memory.id}
            position={position}
            color={color}
            memory={memory}
            // Only the flower beneath the reticle should glow.
            highlighted={targetedItemId === memory.id}
            scale={scale}
            petals={petals}
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
      {GARDEN_TREES.map(({ position, scale, item }) => (
        <Tree
          key={item.id}
          position={position}
          scale={scale}
          item={item}
          // Give the nearest targeted tree a soft canopy glow.
          highlighted={targetedItemId === item.id}
        />
      ))}
      {/* Add independently animated, inspectable animal life among the plants. */}
      <Nature targetedItemId={targetedItemId} />
    </>
  );
}
