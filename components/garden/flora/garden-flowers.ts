// The memory type describes the information shown when a flower is inspected.
import type { FlowerMemory } from "./flower-memory";
// Archetypes keep named species data aligned with their actual bloom structure.
import type { FlowerArchetype } from "./flower/flower-archetype";

// Named fields make each initial flower easier to understand and rearrange.
type GardenFlower = {
  position: [number, number, number];
  color: string;
  scale: number;
  petals: number;
  layers?: number;
  archetype: FlowerArchetype;
  memory: FlowerMemory;
};

// These six flowers form widely separated landmarks throughout the garden.
export const INITIAL_FLOWERS: readonly GardenFlower[] = [
  {
    position: [-9.5, 0, 10.2],
    color: "#eee4cb",
    scale: 0.64,
    petals: 20,
    archetype: "daisy",
    memory: {
      id: "moon-daisy",
      name: "Moon daisy",
      latinName: "Leucanthemum vulgare",
      note: "A small brightness in the entrance meadow.",
    },
  },
  {
    position: [10.2, 0, 8.5],
    color: "#bf7e88",
    scale: 0.67,
    petals: 5,
    archetype: "rose",
    memory: {
      id: "wild-rose",
      name: "Wild rose",
      latinName: "Rosa canina",
      note: "Found opening toward the first light.",
    },
  },
  {
    position: [-12, 0, 1.5],
    color: "#829cc0",
    scale: 0.49,
    petals: 6,
    archetype: "bell",
    memory: {
      id: "bluebell",
      name: "Bluebell",
      latinName: "Hyacinthoides non-scripta",
      note: "A quiet bell at the garden's edge.",
    },
  },
  {
    position: [12.5, 0, -4],
    color: "#e7c068",
    scale: 0.52,
    petals: 5,
    archetype: "buttercup",
    memory: {
      id: "buttercup",
      name: "Buttercup",
      latinName: "Ranunculus acris",
      note: "Holding a little piece of sunlight.",
    },
  },
  {
    position: [-10.8, 0, -13.8],
    color: "#d397af",
    scale: 0.82,
    petals: 8,
    archetype: "cosmos",
    memory: {
      id: "cosmos",
      name: "Cosmos",
      latinName: "Cosmos bipinnatus",
      note: "Remembered for the way it moved in the wind.",
    },
  },
  {
    position: [10, 0, -21.2],
    color: "#efe9dc",
    scale: 0.66,
    petals: 22,
    archetype: "daisy",
    memory: {
      id: "oxeye-daisy",
      name: "Oxeye daisy",
      latinName: "Leucanthemum vulgare",
      note: "Still watching the meadow behind you.",
    },
  },
];

// Derive the tally from the data so adding a flower updates the UI automatically.
export const INITIAL_FLOWER_COUNT = INITIAL_FLOWERS.length;
