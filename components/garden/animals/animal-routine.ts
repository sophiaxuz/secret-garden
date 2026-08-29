// One phase describes a species action and the range of time it may occupy.
export type AnimalRoutinePhase<Name extends string> = {
  // Name lets the visual animal interpret the generic planner in its own language.
  readonly name: Name;
  // A range prevents pauses and journeys repeating at one exact duration.
  readonly minDuration: number;
  readonly maxDuration: number;
};

// Every frame receives one complete, renderer-independent behavior decision.
export type AnimalRoutineSnapshot<Name extends string> = {
  // Phase selects the current species-specific pose or route action.
  phase: Name;
  // Progress runs from zero to one within the current variable-duration phase.
  progress: number;
  // Phase time supports breathing, looking, and stepping rhythms.
  phaseTime: number;
  // Duration is exposed for debugging and deterministic behavior tests.
  duration: number;
  // Cycle index changes after every complete trip through the phase list.
  cycleIndex: number;
  // Variation is one stable negative-to-positive attention choice per phase.
  variation: number;
};

// This narrow stateful interface advances without causing React renders.
export type AnimalRoutine<Name extends string> = {
  // Current inspects the active decision without advancing time.
  current: () => AnimalRoutineSnapshot<Name>;
  // Advance consumes frame time and safely crosses any completed phases.
  advance: (delta: number) => AnimalRoutineSnapshot<Name>;
};

// Produce a stable zero-to-one decision from personality, cycle, phase, and salt.
function seededUnit(
  seed: number,
  cycleIndex: number,
  phaseIndex: number,
  salt: number,
): number {
  // A sine hash is sufficient because decisions are infrequent, not cryptographic.
  const wave =
    Math.sin(
      seed * 12.9898 +
        cycleIndex * 37.719 +
        phaseIndex * 91.137 +
        salt * 53.417,
    ) * 43_758.5453;
  // Removing the integer portion keeps a deterministic positive fraction.
  return wave - Math.floor(wave);
}

// Create one mutable planner with a randomizable personality and deterministic seam.
export function createAnimalRoutine<Name extends string>(
  seed: number,
  phases: readonly AnimalRoutinePhase<Name>[],
): AnimalRoutine<Name> {
  // A routine without any behavior would never be able to advance safely.
  if (phases.length === 0) throw new Error("Animal routine needs a phase");
  // Indices and elapsed phase time are private mutable animation state.
  let phaseIndex = 0;
  let cycleIndex = 0;
  let phaseTime = 0;

  // Calculate the current phase's personality-specific duration.
  function getDuration(): number {
    const phase = phases[phaseIndex];
    // Normalize reversed authoring ranges without making callers defensive.
    const minimum = Math.min(phase.minDuration, phase.maxDuration);
    const maximum = Math.max(phase.minDuration, phase.maxDuration);
    // A small floor guarantees even malformed zero-duration phases can advance.
    return Math.max(
      0.05,
      minimum +
        (maximum - minimum) * seededUnit(seed, cycleIndex, phaseIndex, 1),
    );
  }

  // Translate private state into the complete public frame decision.
  function current(): AnimalRoutineSnapshot<Name> {
    const duration = getDuration();
    // Variation remains unchanged for this phase but differs on later cycles.
    const variation = seededUnit(seed, cycleIndex, phaseIndex, 2) * 2 - 1;
    return {
      phase: phases[phaseIndex].name,
      progress: Math.min(1, phaseTime / duration),
      phaseTime,
      duration,
      cycleIndex,
      variation,
    };
  }

  // Advance by one frame while retaining overshoot at phase boundaries.
  function advance(delta: number): AnimalRoutineSnapshot<Name> {
    // Negative or invalid frame times should never reverse an animal's history.
    if (Number.isFinite(delta)) phaseTime += Math.max(0, delta);
    // A slow frame may cross several short phases, so use a guarded loop.
    let transitions = 0;
    while (phaseTime >= getDuration() && transitions < 100) {
      phaseTime -= getDuration();
      phaseIndex += 1;
      // Completing the final phase begins a newly varied behavior cycle.
      if (phaseIndex >= phases.length) {
        phaseIndex = 0;
        cycleIndex += 1;
      }
      transitions += 1;
    }
    // Return the decision used by this rendered frame.
    return current();
  }

  // Hide mutable scheduling details behind two narrow operations.
  return { current, advance };
}
