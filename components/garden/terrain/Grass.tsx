// Fiber supplies the frame loop that carries live weather through the meadow.
import { useFrame } from "@react-three/fiber";
// React builds stable geometry, layout, and shader callbacks once per mount.
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
// Three supplies reusable transforms, colours, and shader-facing material types.
import * as THREE from "three";
// One shared deterministic hash keeps procedural placements stable and consistent.
import { seededUnit } from "../deterministic-random";
// Shared dimensions keep every tuft inside the explorable island habitat.
import { GARDEN_LAYOUT } from "../garden-layout";
// Live weather is the narrow environmental input used by the grass material.
import type { GardenWeather } from "../weather/garden-weather";
// The coastline test stops decorative grass from growing in the surrounding sea.
import { isInsideGardenShoreline } from "./garden-coastline";
// This pure mapping turns measured wind and rain into restrained meadow motion.
import { getGrassAtmosphere } from "./grass-atmosphere";
// This factory creates twelve fine ribbon blades behind one reusable geometry.
import { createGrassTuftGeometry } from "./grass-geometry";
// The focused shader module owns GPU compilation and per-frame uniform easing.
import {
  animateGrassShader,
  compileGrassShader,
  type CompiledGrassShader,
} from "./grass-shader";

// Extra candidates make organic gaps possible while retaining a lush final field.
const GRASS_TUFT_CANDIDATES = 2350;
// These greens mix cool shadow foliage with a few sun-warmed meadow notes.
const GRASS_COLORS = [
  new THREE.Color("#718b58"),
  new THREE.Color("#5e7c53"),
  new THREE.Color("#879760"),
  new THREE.Color("#557565"),
  new THREE.Color("#98a46d"),
] as const;

// Grass receives weather rather than fetching it, preserving one atmospheric truth.
type GrassProps = {
  // Wind speed, direction, and rain make the meadow respond to the real garden day.
  weather: GardenWeather;
};

// Render the complete living field as one instanced mesh and one draw call.
export function Grass({ weather }: GrassProps) {
  // Calculate the tuft layout only when this module first enters the scene.
  const tufts = useMemo(() => {
    // Calculate the complete walkable width for deterministic scattering.
    const gardenWidth = GARDEN_LAYOUT.bounds.maxX - GARDEN_LAYOUT.bounds.minX;
    // Calculate the complete walkable depth for the same reason.
    const gardenDepth = GARDEN_LAYOUT.bounds.maxZ - GARDEN_LAYOUT.bounds.minZ;
    // Build candidates across the whole island before carving natural open pockets.
    return Array.from({ length: GRASS_TUFT_CANDIDATES }, (_, index) => {
      // Independent seeded values scatter X without visible rows or diagonals.
      const x = GARDEN_LAYOUT.bounds.minX + seededUnit(index, 1) * gardenWidth;
      // A different salt gives Z an unrelated but equally stable distribution.
      const z = GARDEN_LAYOUT.bounds.minZ + seededUnit(index, 2) * gardenDepth;
      // Overlapping low-frequency waves create softly connected meadow colonies.
      const patchNoise =
        Math.sin(x * 0.31 + Math.sin(z * 0.19) * 1.7) *
        Math.cos(z * 0.27 - Math.sin(x * 0.14));
      // Dense areas remain lush while quieter gaps reveal the textured ground below.
      const localDensity = 0.68 + patchNoise * 0.16;
      // Reject points outside either the authored coastline or this local colony.
      if (
        !isInsideGardenShoreline([x, z]) ||
        seededUnit(index, 8) > localDensity
      ) {
        return null;
      }
      // Retain only the small values needed to build this instance later.
      return { index, x, z, patchNoise };
    }).filter((tuft): tuft is NonNullable<typeof tuft> => tuft !== null);
  }, []);
  // Build one tuft and attach stable per-instance silhouette variation to it.
  const tuftGeometry = useMemo(() => {
    // The authored ribbons remain one shared geometry and therefore one draw call.
    const geometry = createGrassTuftGeometry();
    // Two values per tuft vary its internal blade profile inside the GPU shader.
    const variations = new Float32Array(tufts.length * 2);
    // Fill the instanced attribute with stable values from the same layout seed.
    tufts.forEach((tuft, instanceIndex) => {
      // The first value changes which individual blades become dominant.
      variations[instanceIndex * 2] = seededUnit(tuft.index, 11);
      // The second value subtly opens or gathers the complete clump silhouette.
      variations[instanceIndex * 2 + 1] = seededUnit(tuft.index, 12);
    });
    // Instanced attributes vary silhouettes without multiplying mesh objects.
    geometry.setAttribute(
      "instanceVariation",
      new THREE.InstancedBufferAttribute(variations, 2),
    );
    // Return the complete GPU-ready meadow tuft geometry.
    return geometry;
  }, [tufts]);
  // This ref exposes the single Three.js instanced mesh after it mounts.
  const grass = useRef<THREE.InstancedMesh>(null);
  // Keep the compiled shader so the frame loop can animate only its uniforms.
  const shader = useRef<CompiledGrassShader | null>(null);
  // Reuse one wind target vector instead of allocating a new object every frame.
  const windTarget = useRef(new THREE.Vector2());
  // Translate the latest observation outside the per-frame animation path.
  const atmosphere = useMemo(() => getGrassAtmosphere(weather), [weather]);
  // A ref lets the frame loop see new weather without recompiling its callback.
  const atmosphereRef = useRef(atmosphere);
  // Synchronize the ref whenever a fresh weather observation reaches the garden.
  atmosphereRef.current = atmosphere;

  // Extend Three's physically lit material with coherent field-scale wind bands.
  const prepareGrassShader = useCallback(
    (compiled: THREE.WebGLProgramParametersWithUniforms) => {
      // Retain the focused module's finished uniforms for future frame updates.
      shader.current = compileGrassShader(compiled, atmosphereRef.current);
    },
    [],
  );

  // Release the manually created geometry when the grass field unmounts.
  useEffect(() => {
    // Disposal frees its GPU buffers after React removes the instanced mesh.
    return () => tuftGeometry.dispose();
  }, [tuftGeometry]);

  // Fill the shared mesh with one matrix and color for every visible tuft.
  useLayoutEffect(() => {
    // Stop until React has attached the Three.js mesh to the ref.
    if (!grass.current) return;
    // Keep one stable reference so the loop does not repeatedly inspect the ref.
    const grassMesh = grass.current;
    // Reuse one temporary object while composing all instance matrices.
    const transform = new THREE.Object3D();
    // Apply the deterministic transform and color to each instance slot.
    tufts.forEach((tuft, instanceIndex) => {
      // Ground every ribbon base just above the floor to prevent z-fighting.
      transform.position.set(tuft.x, 0.008, tuft.z);
      // Tiny individual leans stop even nearby silhouettes from standing rigidly.
      const leanX = (seededUnit(tuft.index, 9) - 0.5) * 0.1;
      // A separate lean axis avoids all clumps bending toward the same point.
      const leanZ = (seededUnit(tuft.index, 10) - 0.5) * 0.1;
      // Seeded rotation stops neighboring tufts from facing in repeated steps.
      transform.rotation.set(
        leanX,
        seededUnit(tuft.index, 3) * Math.PI * 2,
        leanZ,
      );
      // Lusher colonies grow slightly taller while gaps retain quieter low grass.
      const patchHeight = 0.04 + Math.max(0, tuft.patchNoise) * 0.08;
      // Bias most blades low and reserve a smaller number of graceful tall notes.
      const height =
        0.27 + Math.pow(seededUnit(tuft.index, 5), 1.55) * 0.28 + patchHeight;
      // Gently vary every axis so the meadow never repeats one obvious silhouette.
      transform.scale.set(
        0.76 + seededUnit(tuft.index, 4) * 0.46,
        height,
        0.76 + seededUnit(tuft.index, 6) * 0.46,
      );
      // Convert position, rotation, and scale into one GPU instance matrix.
      transform.updateMatrix();
      // Store that matrix in this tuft's instance slot.
      grassMesh.setMatrixAt(instanceIndex, transform.matrix);
      // Choose one nuanced green deterministically for subtle meadow variation.
      grassMesh.setColorAt(
        instanceIndex,
        GRASS_COLORS[
          Math.floor(seededUnit(tuft.index, 7) * GRASS_COLORS.length)
        ],
      );
    });
    // Tell Three.js to upload the completed matrices to the GPU.
    grassMesh.instanceMatrix.needsUpdate = true;
    // Tell Three.js to upload the optional per-instance colors as well.
    if (grassMesh.instanceColor) grassMesh.instanceColor.needsUpdate = true;
    // Recalculate the shared bounds so off-screen grass can be culled correctly.
    grassMesh.computeBoundingSphere();
  }, [tufts]);

  // Move shader uniforms directly so React does not rerender every animation frame.
  useFrame(({ clock }) => {
    // The material may not be compiled until the first visible render completes.
    if (!shader.current) return;
    // Delegate all closely related uniform easing to the focused shader module.
    animateGrassShader(
      shader.current,
      atmosphereRef.current,
      clock.getElapsedTime(),
      windTarget.current,
    );
  });

  // One shared geometry and material render every grass tuft in one draw call.
  return (
    <instancedMesh
      ref={grass}
      args={[tuftGeometry, undefined, tufts.length]}
      receiveShadow
      userData={{ shadowCaster: false }}
    >
      {/* Instance and vertex colours preserve layered greens through one material. */}
      <meshStandardMaterial
        vertexColors
        roughness={0.88}
        metalness={0}
        side={THREE.DoubleSide}
        onBeforeCompile={prepareGrassShader}
        customProgramCacheKey={() => "living-meadow-v2"}
      />
    </instancedMesh>
  );
}
