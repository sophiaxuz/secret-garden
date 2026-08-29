// The lighting domain supplies the complete set of UK garden phases.
import type { GardenLightPhase } from "../../lighting/uk-garden-time";

// Activity is intentionally binary so every species shares one clear time rule.
export type AnimalActivity = "awake" | "sleeping";

// Translate the astronomical light phase into the animals' shared daily rhythm.
export function getAnimalActivity(phase: GardenLightPhase): AnimalActivity {
  // Animals settle only after dusk has completed and true night begins.
  return phase === "night" ? "sleeping" : "awake";
}
