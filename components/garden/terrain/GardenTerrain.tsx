// Drei loads the generated natural surface textures from public assets.
import { useTexture } from "@react-three/drei";
// React memoizes the coastline while layout effects configure loaded textures.
import { useLayoutEffect, useMemo } from "react";
// Three supplies texture wrapping and color-space constants.
import * as THREE from "three";
// Shared dimensions keep the island, sea, grass, and navigation aligned.
import { GARDEN_LAYOUT } from "../garden-layout";
// Grass hides thousands of procedural blades behind one instanced mesh.
import { Grass } from "./Grass";
// Sea owns the animated lit water extending beyond the island and into fog.
import { Sea } from "./Sea";
// One irregular shape keeps meadow and sandy shoreline perfectly aligned.
import { createGardenIslandShape } from "./garden-coastline";
// Sea lighting reads only the shared astronomical snapshot supplied by Garden.
import type { UkGardenTime } from "../lighting/uk-garden-time";
// Sea motion reads live weather without coupling the rest of terrain to the API.
import type { GardenWeather } from "../weather/garden-weather";

// Terrain needs atmosphere only to pass it through its narrow Sea boundary.
type GardenTerrainProps = {
  // Time controls nocturnal pigment and the painted moon path.
  time: UkGardenTime;
  // Weather controls wave direction, energy, speed, and reflection visibility.
  weather: GardenWeather;
};

// Render every non-interactive surface that forms the garden terrain.
export function GardenTerrain({ time, weather }: GardenTerrainProps) {
  // Load the project-owned meadow material through Drei's texture cache.
  const meadowTexture = useTexture("/material-meadow.webp");
  // Build the authored coastline once rather than reconstructing it on rerenders.
  const islandShape = useMemo(() => createGardenIslandShape(), []);

  // Prepare both textures for repeated world-scale use rather than one stretched image.
  useLayoutEffect(() => {
    // Configure the meadow independently because it covers the complete garden.
    // Mirroring joins identical edge pixels and hides seams in the source image.
    meadowTexture.wrapS = meadowTexture.wrapT = THREE.MirroredRepeatWrapping;
    // Frequent repetition keeps clover and moss at a believable ground scale.
    // ShapeGeometry uses world-like UVs, so this scale repeats every seven metres.
    meadowTexture.repeat.set(1 / 7, 1 / 7);
    // Mark generated color textures as sRGB so their painted palette stays accurate.
    meadowTexture.colorSpace = THREE.SRGBColorSpace;
    // Moderate anisotropy preserves detail when the plane recedes toward the horizon.
    meadowTexture.anisotropy = 8;
    // Upload the changed sampling settings on the next renderer update.
    meadowTexture.needsUpdate = true;
  }, [meadowTexture]);

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
      {/* Rotate the organic shape flat to create the complete garden island. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        userData={{ shadowCaster: false }}
      >
        {/* The triangulated outline contains the complete explorable meadow. */}
        <shapeGeometry args={[islandShape, 8]} />
        {/* High roughness makes the ground diffuse rather than reflective. */}
        <meshStandardMaterial map={meadowTexture} roughness={1} />
      </mesh>
      {/* Render deterministic meadow tufts through one GPU-instanced mesh. */}
      <Grass />
    </>
  );
}
