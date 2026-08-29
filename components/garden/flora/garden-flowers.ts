// The memory type describes the information shown when a flower is inspected.
import type { FlowerMemory } from "./flower-memory";

// Named fields make each initial flower easier to understand and rearrange.
type GardenFlower = {
  position: [number, number, number];
  color: string;
  scale: number;
  petals: number;
  layers?: number;
  bell?: boolean;
  memory: FlowerMemory;
};

// These six flowers form widely separated landmarks throughout the garden.
export const INITIAL_FLOWERS = [
  {
    position: [-9.5, 0, 10.2],
    color: "#eee4cb",
    scale: 0.85,
    petals: 9,
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
    scale: 1.05,
    petals: 12,
    layers: 2,
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
    scale: 0.9,
    petals: 5,
    bell: true,
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
    scale: 0.72,
    petals: 8,
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
    scale: 1.1,
    petals: 10,
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
    scale: 0.9,
    petals: 9,
    memory: {
      id: "oxeye-daisy",
      name: "Oxeye daisy",
      latinName: "Leucanthemum vulgare",
      note: "Still watching the meadow behind you.",
    },
  },
] satisfies readonly GardenFlower[];

// Derive the tally from the data so adding a flower updates the UI automatically.
export const INITIAL_FLOWER_COUNT = INITIAL_FLOWERS.length;
