// Drei loads the generated natural surface textures from public assets.
import { useTexture } from "@react-three/drei";
// React memoizes the coastline while layout effects configure loaded textures.
import { useLayoutEffect, useMemo } from "react";
// Three supplies texture wrapping and color-space constants.
import * as THREE from "three";
// Shared dimensions keep the floor, path, grass, and navigation aligned.
import { GARDEN_LAYOUT } from "../garden-layout";
// Grass hides thousands of procedural blades behind one instanced mesh.
import { Grass } from "./Grass";
// Sea owns the animated lit water extending beyond the island and into fog.
import { Sea } from "./Sea";
// One irregular shape keeps meadow and sandy shoreline perfectly aligned.
import { createGardenIslandShape } from "./garden-coastline";

// Render every non-interactive surface that forms the garden terrain.
export function GardenTerrain() {
  // Load both project-owned surface materials through one cached texture request.
  const [meadowTexture, pathTexture] = useTexture([
    "/material-meadow.webp",
    "/material-path.webp",
  ]);
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
    // Repeat the path texture separately at a finer gravel scale.
    pathTexture.wrapS = pathTexture.wrapT = THREE.MirroredRepeatWrapping;
    pathTexture.repeat.set(1.4, GARDEN_LAYOUT.pathLength / 3.2);
    pathTexture.colorSpace = THREE.SRGBColorSpace;
    pathTexture.anisotropy = 8;
    pathTexture.needsUpdate = true;
  }, [meadowTexture, pathTexture]);

  // A fragment groups terrain without adding an unnecessary transform node.
  return (
    <>
      {/* Water renders first beneath every island surface and disappears into fog. */}
      <Sea />
      {/* A slightly enlarged lower copy forms a narrow organic sandy shoreline. */}
      <mesh
        position={[0, -0.09, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1.045, 1.045, 1]}
        receiveShadow
        userData={{ shadowCaster: false }}
      >
        {/* The shared outline makes the beach follow every irregular coastal bend. */}
        <shapeGeometry args={[islandShape, 8]} />
        {/* Warm mineral color separates the land edge from blue-green water. */}
        <meshStandardMaterial color="#c9b78b" roughness={0.98} />
      </mesh>
      {/* Rotate the organic shape flat to create the complete garden island. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        userData={{ shadowCaster: false }}
      >
        {/* The triangulated outline contains all walking bounds and both path ends. */}
        <shapeGeometry args={[islandShape, 8]} />
        {/* High roughness makes the ground diffuse rather than reflective. */}
        <meshStandardMaterial map={meadowTexture} roughness={1} />
      </mesh>
      {/* A narrower plane sits slightly above the ground as a path. */}
      <mesh
        position={[0, 0.012, GARDEN_LAYOUT.pathCenterZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        userData={{ shadowCaster: false }}
      >
        <planeGeometry
          args={[GARDEN_LAYOUT.pathWidth, GARDEN_LAYOUT.pathLength]}
        />
        <meshStandardMaterial map={pathTexture} roughness={0.96} />
      </mesh>
      {/* Render deterministic meadow tufts through one GPU-instanced mesh. */}
      <Grass />
    </>
  );
}
