// Flower and Tree hide the geometry details behind small reusable interfaces.
import { Flower } from "./flower/Flower";
// Initial flower data lives separately from the scene's rendering logic.
import { INITIAL_FLOWERS } from "./garden-flowers";
// Shared dimensions keep ground, path, grass, and camera limits aligned.
import { GARDEN_LAYOUT } from "./garden-layout";
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
  targetedFlowerId,
}: {
  // This number determines how many new memory flowers are generated.
  plantedCount: number;
  // This id lets the targeted Flower instance render its glow.
  targetedFlowerId: string | null;
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
      {/* Generate many deterministic grass blades without storing them by hand. */}
      {Array.from({ length: 320 }, (_, index) => {
        // Calculate the complete walkable width for deterministic scattering.
        const gardenWidth =
          GARDEN_LAYOUT.bounds.maxX - GARDEN_LAYOUT.bounds.minX;
        // Calculate the complete walkable depth for the same reason.
        const gardenDepth =
          GARDEN_LAYOUT.bounds.maxZ - GARDEN_LAYOUT.bounds.minZ;
        // Modular arithmetic scatters x positions predictably across the field.
        const x = ((index * 2.37) % gardenWidth) + GARDEN_LAYOUT.bounds.minX;
        // A different multiplier prevents z positions from repeating with x.
        const z = ((index * 4.13) % gardenDepth) + GARDEN_LAYOUT.bounds.minZ;
        // Keep the middle clear so the grass does not cover the path.
        if (Math.abs(x) < GARDEN_LAYOUT.pathWidth / 2 + 0.35) return null;
        // Render one narrow cone as a stylized blade of grass.
        return (
          <mesh
            // The array index is stable because this generated list never reorders.
            key={index}
            position={[x, 0.2, z]}
            rotation={[0, index * 0.7, ((index % 3) - 1) * 0.14]}
          >
            {/* Vary blade height slightly to avoid perfect repetition. */}
            <coneGeometry args={[0.035, 0.4 + (index % 5) * 0.06, 5]} />
            {/* Alternate greens to create depth with very simple geometry. */}
            <meshStandardMaterial
              color={index % 3 ? "#57724c" : "#79905c"}
              roughness={1}
            />
          </mesh>
        );
      })}
      {/* Convert each named initial-flower object into a Flower module instance. */}
      {INITIAL_FLOWERS.map(
        ({ position, color, scale, petals, bell, memory }) => (
          <Flower
            key={memory.id}
            position={position}
            color={color}
            memory={memory}
            // Only the flower beneath the reticle should glow.
            highlighted={targetedFlowerId === memory.id}
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
            highlighted={targetedFlowerId === `memory-${index}`}
            // Small size and petal variations make each memory slightly different.
            scale={0.7 + (index % 2) * 0.15}
            petals={7 + (index % 3)}
          />
        ),
      )}
      {/* Place a loose ring of trees around the expanded walkable area. */}
      <Tree position={[-14, 0, 7]} scale={1.3} />
      <Tree position={[14, 0, 4]} scale={1.6} />
      <Tree position={[-12, 0, -7]} scale={1.55} />
      <Tree position={[12, 0, -11]} scale={1.4} />
      <Tree position={[-13.5, 0, -20]} scale={1.65} />
      <Tree position={[13, 0, -21]} scale={1.5} />
      {/* Add independently animated animal life among the static plants. */}
      <Nature />
    </>
  );
}
