// The archetype type keeps this botanical catalogue aligned with bloom rendering.
import type { FlowerArchetype } from "./flower-archetype";

// A small named foliage vocabulary prevents species logic leaking into JSX branches.
export type FlowerFoliage =
  | "toothed-blade"
  | "compound-serrated"
  | "basal-straps"
  | "lobed"
  | "feathery"
  | "paired-leaves";

// Each branch endpoint becomes either a rose bloom-bearing cane or an empty support.
export type FlowerBranch = {
  // Start and end values are local coordinates inside the complete flower group.
  from: readonly [number, number, number];
  to: readonly [number, number, number];
};

// Bloom anchors let one plant carry a raceme or several branching flowers.
export type FlowerBloomAnchor = {
  // Position locates the flower head at the end of its pedicel.
  position: readonly [number, number, number];
  // Rotation lets bells hang and turn along one naturally one-sided raceme.
  rotation: readonly [number, number, number];
  // Scale tapers younger flowers toward the tip of a bluebell spike.
  scale: number;
};

// One complete structure describes whole-plant form, not only a decorative head.
export type FlowerPlantStructure = {
  foliage: FlowerFoliage;
  branches: readonly FlowerBranch[];
  blooms: readonly FlowerBloomAnchor[];
};

// The catalogue is deliberately data-driven so adding a species changes one module.
export const FLOWER_PLANT_STRUCTURES: Record<
  FlowerArchetype,
  FlowerPlantStructure
> = {
  // Daisies carry slim alternating leaves below one sun-facing composite bloom.
  daisy: {
    foliage: "toothed-blade",
    branches: [],
    blooms: [{ position: [-0.008, 1.13, 0], rotation: [0, 0, 0], scale: 1 }],
  },
  // Dog roses form an airy cane with two side flowers and compound leaf sprays.
  rose: {
    foliage: "compound-serrated",
    branches: [
      { from: [-0.005, 0.54, 0], to: [-0.32, 0.92, 0.02] },
      { from: [0.01, 0.66, 0], to: [0.3, 0.99, -0.03] },
    ],
    blooms: [
      { position: [-0.008, 1.13, 0], rotation: [0, 0, 0], scale: 1 },
      {
        position: [-0.32, 0.92, 0.02],
        rotation: [0.05, 0, -0.24],
        scale: 0.68,
      },
      { position: [0.3, 0.99, -0.03], rotation: [-0.04, 0, 0.22], scale: 0.6 },
    ],
  },
  // British bluebells bend through a one-sided line of six nodding flowers.
  bell: {
    foliage: "basal-straps",
    branches: [],
    blooms: [
      {
        position: [0.02, 0.7, 0.12],
        rotation: [0.03, 0.35, -0.08],
        scale: 0.82,
      },
      {
        position: [0.075, 0.8, 0.145],
        rotation: [0.02, 0.52, -0.13],
        scale: 0.9,
      },
      {
        position: [0.12, 0.9, 0.16],
        rotation: [0.04, 0.68, -0.17],
        scale: 0.96,
      },
      {
        position: [0.15, 0.995, 0.15],
        rotation: [0.03, 0.82, -0.21],
        scale: 0.9,
      },
      {
        position: [0.155, 1.075, 0.125],
        rotation: [0.02, 0.98, -0.25],
        scale: 0.76,
      },
      {
        position: [0.13, 1.14, 0.09],
        rotation: [0.02, 1.12, -0.28],
        scale: 0.6,
      },
    ],
  },
  // Buttercups keep a fine upright stem above low hand-shaped leaves.
  buttercup: {
    foliage: "lobed",
    branches: [],
    blooms: [{ position: [-0.008, 1.13, 0], rotation: [0, 0, 0], scale: 1 }],
  },
  // Cosmos is recognised by airy divided leaves beneath its papery bloom.
  cosmos: {
    foliage: "feathery",
    branches: [],
    blooms: [{ position: [-0.008, 1.13, 0], rotation: [0, 0, 0], scale: 1 }],
  },
  // Unidentified memories use a balanced herbaceous form without false taxonomy.
  meadow: {
    foliage: "paired-leaves",
    branches: [],
    blooms: [{ position: [-0.008, 1.13, 0], rotation: [0, 0, 0], scale: 1 }],
  },
};
