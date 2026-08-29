// The lighting domain supplies the complete set of UK garden phases.
import type { GardenLightPhase } from "../../lighting/uk-garden-time";
// HabitatPoint keeps sleep anchors renderer-independent and consistently ordered.
import type { HabitatPoint } from "../animal-habitats";

// Activity is intentionally binary so every species shares one clear time rule.
export type AnimalActivity = "awake" | "sleeping";
// Null means ordinary activity; a tuple means night has captured a resting place.
export type AnimalSleepAnchor = HabitatPoint | null;
// Flyers remain visibly active while travelling to or from supported rest points.
export type FlyingSleepPhase = "awake" | "settling" | "sleeping" | "waking";
// Each frame receives both a meaningful phase and an optional movement target.
export type FlyingSleepDecision = {
  // Phase tells the renderer whether wings and eyes should look awake or asleep.
  phase: FlyingSleepPhase;
  // Target is a roost or paused route point while a transition is underway.
  target: HabitatPoint | null;
};
// A tiny stateful interface remembers one flight without exposing mutable details.
export type FlyingSleepJourney = {
  // Update consumes the current environment and returns the next visible intention.
  update(
    sleeping: boolean,
    currentPosition: HabitatPoint,
    restPosition: HabitatPoint,
  ): FlyingSleepDecision;
};

// Translate the astronomical light phase into the animals' shared daily rhythm.
export function getAnimalActivity(phase: GardenLightPhase): AnimalActivity {
  // Animals settle only after dusk has completed and true night begins.
  return phase === "night" ? "sleeping" : "awake";
}

// Hold the first position reached at night, then release it when daylight returns.
export function getAnimalSleepAnchor(
  existingAnchor: AnimalSleepAnchor,
  sleeping: boolean,
  currentPosition: HabitatPoint,
): AnimalSleepAnchor {
  // Dawn removes the temporary anchor so the paused daytime route can continue.
  if (!sleeping) return null;
  // Later sleeping frames retain the original location rather than sliding away.
  if (existingAnchor) return existingAnchor;
  // Copy coordinates so a mutable renderer object cannot move the stored anchor.
  return [...currentPosition];
}

// Calculate straight-line distance without importing Three.js into behaviour tests.
function distanceBetween(first: HabitatPoint, second: HabitatPoint): number {
  // Hypot combines all three world axes into one physical distance.
  return Math.hypot(
    first[0] - second[0],
    first[1] - second[1],
    first[2] - second[2],
  );
}

// Create one night journey that preserves both physical support and dawn continuity.
export function createFlyingSleepJourney(): FlyingSleepJourney {
  // This private point remembers where ordinary flight paused at nightfall.
  let daytimeAnchor: HabitatPoint | null = null;
  // A small arrival radius prevents floating-point noise blocking a transition.
  const arrivalDistance = 0.08;

  // Return the single public state transition operation.
  return {
    update(
      sleeping: boolean,
      currentPosition: HabitatPoint,
      restPosition: HabitatPoint,
    ): FlyingSleepDecision {
      // Night captures the original flight point once before heading to support.
      if (sleeping) {
        if (!daytimeAnchor) daytimeAnchor = [...currentPosition];
        // Reaching the roost is the only event that permits closed-eye sleep.
        const phase =
          distanceBetween(currentPosition, restPosition) <= arrivalDistance
            ? "sleeping"
            : "settling";
        // Both phases retain the same physical roost as their destination.
        return { phase, target: restPosition };
      }
      // No stored night journey means ordinary daytime flight can continue.
      if (!daytimeAnchor) return { phase: "awake", target: null };
      // Dawn remains a waking flight until the paused route point is reached.
      if (distanceBetween(currentPosition, daytimeAnchor) > arrivalDistance) {
        return { phase: "waking", target: daytimeAnchor };
      }
      // Arrival releases private state before normal flight resumes this frame.
      daytimeAnchor = null;
      return { phase: "awake", target: null };
    },
  };
}
