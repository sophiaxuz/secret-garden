// Drei loads the project-owned botanical texture through its shared cache.
import { useTexture } from "@react-three/drei";
// Fiber advances slow environmental material transitions without React rerenders.
import { useFrame } from "@react-three/fiber";
// React memoizes atmosphere, geometry, texture setup, and shader boundaries.
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
// Three supplies the coastline shape, texture controls, and material shader type.
import * as THREE from "three";
// UK time supplies season and the current light phase already used by the sky.
import type { UkGardenTime } from "../../lighting/uk-garden-time";
// Live weather supplies rain without creating a second forecasting dependency.
import type { GardenWeather } from "../../weather/garden-weather";
// A pure mapper produces restrained artistic controls from shared environment data.
import { getGroundAtmosphere } from "./ground-atmosphere";
// True subdivided relief replaces the mathematically flat first material pass.
import { createMeadowGroundGeometry } from "./meadow-ground-geometry";
// The shader module owns large-scale variation and smooth atmospheric updates.
import {
  animateGroundShader,
  compileGroundShader,
  type CompiledGroundShader,
} from "./ground-shader";

// The meadow consumes an already-authored coast plus the shared environment snapshots.
type MeadowGroundProps = {
  // One shape keeps meadow, beach, collisions, and sea aligned to the same island.
  shape: THREE.Shape;
  // Time gives the botanical pigment a restrained seasonal and nocturnal response.
  time: UkGardenTime;
  // Weather lets moss and exposed loam become selectively damp during real rain.
  weather: GardenWeather;
};

// Render the detailed living floor beneath procedural grass and garden inhabitants.
export function MeadowGround({ shape, time, weather }: MeadowGroundProps) {
  // Load the new top-down moss, clover, loam, and fine-fiber albedo artwork.
  const meadowTexture = useTexture("/material-meadow-v2.webp");
  // Tessellate and gently undulate the exact coastline only when its shape changes.
  const groundGeometry = useMemo(
    () => createMeadowGroundGeometry(shape),
    [shape],
  );
  // Translate time and weather outside the high-frequency render loop.
  const atmosphere = useMemo(
    () => getGroundAtmosphere(time, weather),
    [time, weather],
  );
  // A ref gives future frames the newest observation without recompiling shaders.
  const atmosphereRef = useRef(atmosphere);
  // Synchronize the renderer-facing ref whenever the shared environment changes.
  atmosphereRef.current = atmosphere;
  // Retain the material shader after Three completes its first visible compilation.
  const shader = useRef<CompiledGroundShader | null>(null);

  // Configure one high-resolution texture for believable real-world botanical scale.
  useLayoutEffect(() => {
    // Mirroring guarantees soft joins even when generated source edges differ subtly.
    meadowTexture.wrapS = meadowTexture.wrapT = THREE.MirroredRepeatWrapping;
    // One tile covers roughly three metres so clover leaves stay naturally small.
    meadowTexture.repeat.set(1 / 3.2, 1 / 3.2);
    // The artwork is authored colour and therefore needs standard sRGB decoding.
    meadowTexture.colorSpace = THREE.SRGBColorSpace;
    // Trilinear filtering keeps detail calm as the visitor looks toward the horizon.
    meadowTexture.minFilter = THREE.LinearMipmapLinearFilter;
    // Ordinary linear magnification avoids crunchy pixels beside the camera.
    meadowTexture.magFilter = THREE.LinearFilter;
    // Strong anisotropy protects fine fibers across the ground's grazing angle.
    meadowTexture.anisotropy = 12;
    // Upload every changed sampler setting before the next garden frame.
    meadowTexture.needsUpdate = true;
  }, [meadowTexture]);

  // Release the manually constructed relief geometry after the ground unmounts.
  useEffect(() => {
    // Disposal frees dense position, normal, and UV buffers from GPU memory.
    return () => groundGeometry.dispose();
  }, [groundGeometry]);

  // Compile the standard lit material with the focused botanical ground treatment.
  const prepareGroundShader = useCallback(
    (compiled: THREE.WebGLProgramParametersWithUniforms) => {
      // Store the returned uniform boundary for gentle future atmosphere updates.
      shader.current = compileGroundShader(compiled, atmosphereRef.current);
    },
    [],
  );

  // Ease weather and light changes directly on the GPU instead of rerendering React.
  useFrame(() => {
    // The earliest frame may arrive before Three has compiled a visible material.
    if (!shader.current) return;
    // The shader module owns every closely related transition coefficient.
    animateGroundShader(shader.current, atmosphereRef.current);
  });

  // One textured shape forms the complete irregular meadow in one draw call.
  return (
    <mesh
      geometry={groundGeometry}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      userData={{ shadowCaster: false }}
    >
      {/* One physical material combines authored detail, relief, weather, and light. */}
      <meshStandardMaterial
        map={meadowTexture}
        roughness={atmosphere.roughness}
        metalness={0}
        onBeforeCompile={prepareGroundShader}
        customProgramCacheKey={() => "botanical-meadow-ground-v2"}
      />
    </mesh>
  );
}
