// Fiber advances subtle wind response without rerendering React every frame.
import { useFrame } from "@react-three/fiber";
// React retains the root plant transform throughout animation and interaction.
import { useRef } from "react";
// Three supplies the group type and restrained numeric weather mapping.
import * as THREE from "three";
// The shared target hides flower registration, metadata, and cleanup.
import { GardenInteractionTarget } from "../interaction/GardenInteractionTarget";
// The open bell renderer owns its hollow corolla, curled rim, and inner stamens.
import { BellBloom } from "./flower/BellBloom";
// A cohesive atmosphere value prevents wind fields travelling as unrelated numbers.
import {
  getFlowerWindTravelRadians,
  type FlowerAtmosphere,
} from "./flower/flower-atmosphere";
// Open archetypes share curved petals while preserving recognisable species form.
import { FlowerBloom } from "./flower/FlowerBloom";
// One instanced foliage component selects the whole plant's species silhouette.
import { FlowerFoliage } from "./flower/FlowerFoliage";
// This type keeps the flower's renderer and authored species data in agreement.
import type { FlowerArchetype } from "./flower/flower-archetype";
// The catalogue owns branches, foliage, and every bloom attachment together.
import { FLOWER_PLANT_STRUCTURES } from "./flower/flower-plant-structure";
// A curved tube replaces the old mechanically straight cylinder stem.
import { FlowerStem, FlowerStemSegment } from "./flower/FlowerStem";
// The memory object gives this visual flower identity and inspectable content.
import type { FlowerMemory } from "./flower-memory";

// These values describe one complete procedural or species-authored flower.
type FlowerProps = {
  // A tuple stores the rooted world x, y, and z coordinates.
  position: [number, number, number];
  // Petal pigment comes from authored species data or a planted-memory palette.
  color: string;
  // This data is exposed through the interaction registry and inspection dialog.
  memory: FlowerMemory;
  // The targeted flower receives a subtle whole-bloom glow.
  highlighted?: boolean;
  // Scale controls complete plant stature while retaining botanical proportions.
  scale?: number;
  // Petal count follows species structure and varies unidentified memory flowers.
  petals?: number;
  // Layers allow a genuinely fuller flower to overlap curved petal rings.
  layers?: number;
  // Archetype selects the flower's distinct structural vocabulary.
  archetype?: FlowerArchetype;
  // Wind connects the plant to one coherent real UK atmosphere value.
  atmosphere?: FlowerAtmosphere;
};

// Build one complete botanically structured flower rooted in the living meadow.
export function Flower({
  position,
  color,
  memory,
  highlighted = false,
  scale = 1,
  petals = 8,
  layers = 1,
  archetype = "meadow",
  atmosphere = { windSpeedKph: 6, windDirectionDegrees: 240 },
}: FlowerProps) {
  // The root group pivots every stem and bloom together from the soil surface.
  const flower = useRef<THREE.Group>(null);
  // Bell flowers lean to one side to carry their one-sided woodland raceme.
  const hanging = archetype === "bell";
  // One species record now owns the complete plant rather than only its flower head.
  const structure = FLOWER_PLANT_STRUCTURES[archetype];
  // Stable spatial phase prevents every flower swaying in synchronized rows.
  const windPhase = position[0] * 0.37 + position[2] * 0.19;
  // Convert meteorological bearing into one horizontal garden direction.
  const windRadians = getFlowerWindTravelRadians(
    atmosphere.windDirectionDegrees,
  );
  // Map even strong forecasts to a gentle flexible-stem rotation.
  const swayStrength = THREE.MathUtils.clamp(
    0.004 + atmosphere.windSpeedKph / 820,
    0.004,
    0.034,
  );

  // Move slowly from the rooted base so blooms feel alive without bobbing mechanically.
  useFrame(({ clock }) => {
    // The first frame may arrive before React has attached the flower group ref.
    if (!flower.current) return;
    // Two frequencies produce changing gust shape instead of one pendulum rhythm.
    const sway =
      Math.sin(clock.elapsedTime * 0.72 + windPhase) * swayStrength +
      Math.sin(clock.elapsedTime * 1.31 + windPhase * 1.7) *
        swayStrength *
        0.28;
    // Wind direction divides the bend naturally across the garden's X and Z axes.
    flower.current.rotation.z = sway * Math.cos(windRadians);
    flower.current.rotation.x = sway * Math.sin(windRadians);
  });

  // Grouping every botanical part lets scale, position, and sway remain coherent.
  return (
    <group ref={flower} position={position} scale={scale}>
      {/* One invisible volume surrounds stem, leaves, and complete flower head. */}
      <GardenInteractionTarget
        item={{ ...memory, kind: "flower" }}
        position={[0, 0.62, 0]}
        size={[0.72, 1.35, 0.72]}
      />
      {/* A continuous curved tube gives the plant one grown load-bearing stem. */}
      <FlowerStem hanging={hanging} highlighted={highlighted} />
      {/* Rose canes and bluebell pedicels visibly connect every secondary bloom. */}
      {structure.branches.map((branch, index) => (
        <FlowerStemSegment
          key={`branch-${index}`}
          from={branch.from}
          to={branch.to}
          radius={0.012}
        />
      ))}
      {/* Each bluebell hangs from a fine side stalk instead of touching the spike. */}
      {hanging &&
        structure.blooms.map((bloom, index) => (
          <FlowerStemSegment
            key={`pedicel-${index}`}
            from={[bloom.position[0] * 0.68, bloom.position[1] - 0.025, 0]}
            to={bloom.position}
            radius={0.007}
          />
        ))}
      {/* Species-specific instanced foliage changes the complete plant silhouette. */}
      <FlowerFoliage kind={structure.foliage} />
      {/* A rose branches into three flowers while a bluebell carries six nodding bells. */}
      {structure.blooms.map((bloom, index) => (
        <group
          key={`bloom-${index}`}
          position={[...bloom.position]}
          rotation={[...bloom.rotation]}
          scale={bloom.scale}
        >
          {hanging ? (
            // A hollow open corolla replaces the old downward solid cone.
            <BellBloom color={color} highlighted={highlighted} />
          ) : (
            // Open blooms combine curved petals, sepals, receptacle, and stamens.
            <FlowerBloom
              color={color}
              profile={archetype}
              petals={petals}
              layers={layers}
              highlighted={highlighted}
            />
          )}
        </group>
      ))}
    </group>
  );
}
