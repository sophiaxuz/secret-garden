// Generic garden details prevent flower memories and inspection cards from drifting.
import type { GardenItemDetails } from "../interaction/garden-item";

// A flower memory supplies the details that gain `kind: "flower"` when rendered.
export type FlowerMemory = GardenItemDetails;
