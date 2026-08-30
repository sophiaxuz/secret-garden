// Fiber advances one shared wind clock for the complete batched memory meadow.
import { useFrame } from "@react-three/fiber";
// React uploads stable transforms and retains one shared shader binding.
import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
// Three supplies shared geometry, instance matrices, and restrained pigment variation.
import * as THREE from "three";
// One hidden target per memory preserves click and keyboard inspection behavior.
import { GardenInteractionTarget } from "../../interaction/GardenInteractionTarget";
// Curved leaves and petals reuse the same close-up geometry vocabulary as named plants.
import { createFlowerLeafGeometry } from "../flower-leaf-shape";
import { createFlowerPetalGeometry } from "../flower-petal-shape";
// Stable meadow coordinates keep planted memories apart across revisits.
import { getPlantedFlowerPosition } from "../garden-flower-layout";
// One atmosphere value keeps the named and visitor-created flower paths coherent.
import {
  getFlowerWindTravelRadians,
  type FlowerAtmosphere,
} from "./flower-atmosphere";
// The pure planner owns instance counts and the honest unidentified profile cycle.
import {
  getPlantedFlowerBatchPlan,
  PLANTED_FLOWER_PROFILES,
} from "./planted-flower-batches";

// These restrained pigments resemble natural dry meadow and cottage-garden flowers.
const PLANTED_FLOWER_COLORS = ["#dca25f", "#b88fae", "#e7c56f"] as const;
// One immutable geometry buffer serves every memory-flower stem.
const PLANTED_STEM_GEOMETRY = new THREE.CylinderGeometry(0.012, 0.017, 1.05, 7);
// One folded blade buffer serves the two differently transformed leaves per plant.
const PLANTED_LEAF_GEOMETRY = createFlowerLeafGeometry();
// One quiet composite-disc surface serves every unidentified flower center.
const PLANTED_CENTRE_GEOMETRY = new THREE.SphereGeometry(0.067, 14, 8);
// Each profile gets one shared curved petal surface and one visible draw batch.
const PLANTED_PETAL_GEOMETRIES = {
  meadow: createFlowerPetalGeometry("meadow"),
  cosmos: createFlowerPetalGeometry("cosmos"),
  buttercup: createFlowerPetalGeometry("buttercup"),
} as const;

// The injected shader uses shared mutable uniforms instead of rerendering each frame.
function usePlantedFlowerWind(atmosphere: FlowerAtmosphere) {
  // Uniform objects remain stable so all six material programs observe one clock.
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      direction: { value: new THREE.Vector2() },
      strength: { value: 0 },
    }),
    [],
  );
  // Convert "wind from" weather bearing into the direction flexible stems travel.
  const windRadians = getFlowerWindTravelRadians(
    atmosphere.windDirectionDegrees,
  );
  uniforms.direction.value.set(Math.cos(windRadians), Math.sin(windRadians));
  // Even storm observations remain a graceful garden bend rather than a collapse.
  uniforms.strength.value = THREE.MathUtils.clamp(
    0.004 + atmosphere.windSpeedKph / 900,
    0.004,
    0.032,
  );

  // One frame callback advances every planted stem, leaf, center, and petal shader.
  useFrame(({ clock }) => {
    uniforms.time.value = clock.elapsedTime;
  });

  // Patch Three's ordinary instanced projection step with a rooted GPU wind bend.
  return useCallback(
    (shader: THREE.WebGLProgramParametersWithUniforms) => {
      // Share exact uniform objects so every compiled material follows one atmosphere.
      shader.uniforms.uFlowerWindTime = uniforms.time;
      shader.uniforms.uFlowerWindDirection = uniforms.direction;
      shader.uniforms.uFlowerWindStrength = uniforms.strength;
      // Declare the three lightweight inputs before Three's standard vertex chunks.
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `#include <common>
uniform float uFlowerWindTime;
uniform vec2 uFlowerWindDirection;
uniform float uFlowerWindStrength;`,
      );
      // Bend after instance placement so ground height and spatial phase are available.
      shader.vertexShader = shader.vertexShader.replace(
        "#include <project_vertex>",
        `vec4 flowerFieldPosition = instanceMatrix * vec4(transformed, 1.0);
float flowerRootHeight = max(0.0, flowerFieldPosition.y);
float flowerWindPhase = dot(flowerFieldPosition.xz, vec2(0.173, 0.117));
float flowerGust = sin(uFlowerWindTime * 0.72 + flowerWindPhase)
  + sin(uFlowerWindTime * 1.31 + flowerWindPhase * 1.7) * 0.28;
flowerFieldPosition.xz += uFlowerWindDirection
  * flowerGust
  * uFlowerWindStrength
  * pow(flowerRootHeight, 1.55);
vec4 mvPosition = modelViewMatrix * flowerFieldPosition;
gl_Position = projectionMatrix * mvPosition;`,
      );
    },
    [uniforms],
  );
}

// Copy a composed local object through a plant root into one GPU instance slot.
function setNestedInstance(
  mesh: THREE.InstancedMesh,
  index: number,
  root: THREE.Object3D,
  local: THREE.Object3D,
  matrix: THREE.Matrix4,
) {
  // Multiplication preserves local botanical proportions after world placement.
  matrix.multiplyMatrices(root.matrix, local.matrix);
  // The completed transform enters only the requested mesh instance slot.
  mesh.setMatrixAt(index, matrix);
}

// The mesh-only child uses a stable hook shape even when the field grows from zero.
function PlantedFlowerMeshes({
  flowerCount,
  atmosphere,
}: {
  flowerCount: number;
  atmosphere: FlowerAtmosphere;
}) {
  // Count every instance before allocating exact-sized GPU buffers.
  const plan = getPlantedFlowerBatchPlan(flowerCount);
  // Each ref points to one of the six visible batches after React mounts the scene.
  const stems = useRef<THREE.InstancedMesh>(null);
  const leaves = useRef<THREE.InstancedMesh>(null);
  const centres = useRef<THREE.InstancedMesh>(null);
  const meadowPetals = useRef<THREE.InstancedMesh>(null);
  const cosmosPetals = useRef<THREE.InstancedMesh>(null);
  const buttercupPetals = useRef<THREE.InstancedMesh>(null);
  // All six batches share one weather direction, strength, and animated wind clock.
  const bindWindShader = usePlantedFlowerWind(atmosphere);

  // Compose the complete field once whenever a memory flower is planted.
  useLayoutEffect(() => {
    // All six meshes must exist before the coordinated buffers can be filled.
    if (
      !stems.current ||
      !leaves.current ||
      !centres.current ||
      !meadowPetals.current ||
      !cosmosPetals.current ||
      !buttercupPetals.current
    ) {
      return;
    }
    // A profile lookup directs each petal into the correct shared-geometry batch.
    const petalMeshes = {
      meadow: meadowPetals.current,
      cosmos: cosmosPetals.current,
      buttercup: buttercupPetals.current,
    };
    // Independent counters pack each family without empty instance gaps.
    const petalOffsets = { meadow: 0, cosmos: 0, buttercup: 0 };
    // Reused objects avoid allocating hundreds of temporary transforms.
    const root = new THREE.Object3D();
    const local = new THREE.Object3D();
    const matrix = new THREE.Matrix4();
    const pigment = new THREE.Color();

    // Fill stems, two leaves, centers, and every curved petal plant by plant.
    for (let index = 0; index < plan.flowerCount; index += 1) {
      // World position comes from the same finite plot seam used by interaction.
      const position = getPlantedFlowerPosition(index);
      // Tiny deterministic lean and turn stop the batched field reading as a grid.
      const scale = 0.7 + (index % 2) * 0.15;
      root.position.set(...position);
      root.rotation.set(
        Math.sin(index * 4.17) * 0.018,
        Math.sin(index * 8.31) * 0.42,
        Math.cos(index * 3.73) * 0.022,
      );
      root.scale.setScalar(scale);
      root.updateMatrix();

      // The shared stem geometry is centered, so lift it by half its local height.
      local.position.set(0, 0.525, 0);
      local.rotation.set(0, 0, 0);
      local.scale.set(1, 1, 1);
      local.updateMatrix();
      setNestedInstance(stems.current, index, root, local, matrix);

      // Two alternating blades give every memory a readable herbaceous base.
      for (let leafIndex = 0; leafIndex < 2; leafIndex += 1) {
        // Side selects opposing positions and rotations around the stem.
        const side = leafIndex === 0 ? -1 : 1;
        local.position.set(side * 0.13, 0.4 + leafIndex * 0.23, 0);
        local.rotation.set(side * -0.12, side * 0.28, side * -0.82);
        local.scale.setScalar(leafIndex === 0 ? 0.62 : 0.48);
        local.updateMatrix();
        setNestedInstance(
          leaves.current,
          index * 2 + leafIndex,
          root,
          local,
          matrix,
        );
      }

      // A flattened ochre disc sits just above the radial petal attachments.
      local.position.set(-0.008, 1.164, 0);
      local.rotation.set(0, 0, 0);
      local.scale.set(1, 0.34, 1);
      local.updateMatrix();
      setNestedInstance(centres.current, index, root, local, matrix);
      // Slight per-center colour variation creates granular meadow rhythm.
      pigment.set(index % 2 === 0 ? "#c79735" : "#b9852e");
      centres.current.setColorAt(index, pigment);

      // Profile and petal count follow the exact pure batch-plan cycle.
      const profile =
        PLANTED_FLOWER_PROFILES[index % PLANTED_FLOWER_PROFILES.length];
      const petalCount = 7 + (index % 3);
      const petalMesh = petalMeshes[profile];
      // Each petal keeps an individual radial transform inside its family mesh.
      for (let petalIndex = 0; petalIndex < petalCount; petalIndex += 1) {
        // Even radial spacing is softened by deterministic roll and size changes.
        const angle = (petalIndex * Math.PI * 2) / petalCount;
        const radius = 0.014 + Math.sin((petalIndex + 1) * 9.73) * 0.004;
        local.position.set(
          -0.008 + Math.sin(angle) * radius,
          1.13,
          Math.cos(angle) * radius,
        );
        local.rotation.set(
          Math.cos(petalIndex * 2.3) * 0.018,
          angle,
          Math.sin(petalIndex * 4.11) * 0.035,
        );
        local.scale.setScalar(0.94 + Math.sin(petalIndex * 7.17) * 0.045);
        local.updateMatrix();
        // Write sequentially into the current profile's exact-sized instance buffer.
        const offset = petalOffsets[profile];
        setNestedInstance(petalMesh, offset, root, local, matrix);
        // Natural pigment variation preserves identity without duplicate materials.
        pigment.set(
          PLANTED_FLOWER_COLORS[index % PLANTED_FLOWER_COLORS.length],
        );
        pigment.offsetHSL(
          0,
          Math.sin(petalIndex * 1.9) * 0.015,
          Math.cos(petalIndex * 2.7) * 0.02,
        );
        petalMesh.setColorAt(offset, pigment);
        petalOffsets[profile] += 1;
      }
    }

    // Upload matrices, colors, and conservative bounds once after field assembly.
    [
      stems.current,
      leaves.current,
      centres.current,
      meadowPetals.current,
      cosmosPetals.current,
      buttercupPetals.current,
    ].forEach((mesh) => {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
  }, [flowerCount, plan.flowerCount]);

  // Six visible instanced meshes replace hundreds of individual flower draw calls.
  return (
    <>
      <instancedMesh
        ref={stems}
        args={[PLANTED_STEM_GEOMETRY, undefined, plan.stemCount]}
        castShadow
      >
        <meshStandardMaterial
          color="#486f47"
          roughness={0.9}
          onBeforeCompile={bindWindShader}
        />
      </instancedMesh>
      <instancedMesh
        ref={leaves}
        args={[PLANTED_LEAF_GEOMETRY, undefined, plan.leafCount]}
        castShadow
      >
        <meshPhysicalMaterial
          color="#52794c"
          roughness={0.82}
          sheen={0.18}
          sheenColor="#829a70"
          side={THREE.DoubleSide}
          onBeforeCompile={bindWindShader}
        />
      </instancedMesh>
      <instancedMesh
        ref={centres}
        args={[PLANTED_CENTRE_GEOMETRY, undefined, plan.flowerCount]}
        castShadow
      >
        <meshStandardMaterial
          vertexColors
          color="#ffffff"
          roughness={0.78}
          onBeforeCompile={bindWindShader}
        />
      </instancedMesh>
      <instancedMesh
        ref={meadowPetals}
        args={[
          PLANTED_PETAL_GEOMETRIES.meadow,
          undefined,
          plan.petalCounts.meadow,
        ]}
        castShadow
      >
        <meshPhysicalMaterial
          vertexColors
          color="#ffffff"
          roughness={0.64}
          sheen={0.24}
          side={THREE.DoubleSide}
          onBeforeCompile={bindWindShader}
        />
      </instancedMesh>
      <instancedMesh
        ref={cosmosPetals}
        args={[
          PLANTED_PETAL_GEOMETRIES.cosmos,
          undefined,
          plan.petalCounts.cosmos,
        ]}
        castShadow
      >
        <meshPhysicalMaterial
          vertexColors
          color="#ffffff"
          roughness={0.62}
          sheen={0.34}
          side={THREE.DoubleSide}
          onBeforeCompile={bindWindShader}
        />
      </instancedMesh>
      <instancedMesh
        ref={buttercupPetals}
        args={[
          PLANTED_PETAL_GEOMETRIES.buttercup,
          undefined,
          plan.petalCounts.buttercup,
        ]}
        castShadow
      >
        <meshPhysicalMaterial
          vertexColors
          color="#ffffff"
          roughness={0.5}
          clearcoat={0.12}
          side={THREE.DoubleSide}
          onBeforeCompile={bindWindShader}
        />
      </instancedMesh>
    </>
  );
}

// Render a high-capacity visitor-created meadow with individual interaction targets.
export function PlantedFlowerField({
  plantedCount,
  targetedItemId,
  atmosphere,
}: {
  plantedCount: number;
  targetedItemId: string | null;
  atmosphere: FlowerAtmosphere;
}) {
  // Clamp once so visible meshes and inspectable memories share an exact count.
  const plan = getPlantedFlowerBatchPlan(plantedCount);

  // Interaction remains individual even though visible botanical surfaces are batched.
  return (
    <>
      {/* Avoid mounting zero-sized instanced meshes before the first memory exists. */}
      {plan.flowerCount > 0 && (
        <PlantedFlowerMeshes
          flowerCount={plan.flowerCount}
          atmosphere={atmosphere}
        />
      )}
      {/* Hidden targets preserve each memory's name, note, click, and keyboard path. */}
      {Array.from({ length: plan.flowerCount }, (_, index) => {
        // Build the same stable identity previously owned by an individual Flower.
        const item = {
          id: `memory-${index}`,
          kind: "flower" as const,
          name: "Unidentified memory",
          note: "Waiting to be identified, but already part of your garden.",
        };
        // The target lives directly in world space beside the batched visible plant.
        return (
          <GardenInteractionTarget
            key={item.id}
            item={item}
            position={[
              getPlantedFlowerPosition(index)[0],
              0.54,
              getPlantedFlowerPosition(index)[2],
            ]}
            size={[0.56, 1.2, 0.56]}
            highlighted={targetedItemId === item.id}
          />
        );
      })}
    </>
  );
}
