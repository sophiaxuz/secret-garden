// React memoizes the authored coastline shared by every island surface.
import { useMemo } from "react";
// Shared dimensions keep the island, sea, grass, and navigation aligned.
import { GARDEN_LAYOUT } from "../garden-layout";
// Grass hides thousands of procedural blades behind one instanced mesh.
import { Grass } from "./Grass";
// MeadowGround owns botanical texture scale, relief, weather, and broad variation.
import { MeadowGround } from "./ground/MeadowGround";
// Sea owns the animated lit water extending beyond the island and into fog.
import { Sea } from "./Sea";
// One irregular shape keeps meadow and sandy shoreline perfectly aligned.
import { createGardenIslandShape } from "./garden-coastline";
// Sea lighting reads only the shared astronomical snapshot supplied by Garden.
import type { UkGardenTime } from "../lighting/uk-garden-time";
// Sea motion reads live weather without coupling the rest of terrain to the API.
import type { GardenWeather } from "../weather/garden-weather";

// Terrain passes the shared atmosphere into surfaces that visibly respond to it.
type GardenTerrainProps = {
  // Time controls nocturnal pigment and the painted moon path.
  time: UkGardenTime;
  // Weather controls wave direction, energy, speed, and reflection visibility.
  weather: GardenWeather;
};

// Render every non-interactive surface that forms the garden terrain.
export function GardenTerrain({ time, weather }: GardenTerrainProps) {
  // Build the authored coastline once rather than reconstructing it on rerenders.
  const islandShape = useMemo(() => createGardenIslandShape(), []);

  // A fragment groups terrain without adding an unnecessary transform node.
  return (
    <>
      {/* Water renders first beneath every island surface and disappears into fog. */}
      <Sea time={time} weather={weather} />
      {/* A barely enlarged lower copy leaves a slim wet-sand edge below the wash. */}
      <mesh
        position={[0, -0.075, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1.018, 1.018, 1]}
        receiveShadow
        userData={{ shadowCaster: false }}
      >
        {/* The shared outline makes the beach follow every irregular coastal bend. */}
        <shapeGeometry args={[islandShape, 8]} />
        {/* Darker damp mineral color avoids a bright artificial-looking border. */}
        <meshStandardMaterial color="#9d906f" roughness={0.9} />
      </mesh>
      {/* Botanical detail, relief, light, and weather form the complete island floor. */}
      <MeadowGround shape={islandShape} time={time} weather={weather} />
      {/* Render deterministic meadow tufts animated by the same live weather. */}
      <Grass weather={weather} />
    </>
  );
}
