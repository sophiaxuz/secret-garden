// Vitest protects the shared surprise mechanism independently from Three.js.
import { expect, test } from "vitest";
// The planner gives every species variable but reproducible behavior phases.
import { createAnimalRoutine } from "./animal-routine";

// A fixed seed must make tests stable while successive cycles still feel different.
test("animal routines vary phase timing without becoming test-flaky", () => {
  // Two planners with the same personality seed should make identical decisions.
  const first = createAnimalRoutine(42, [
    { name: "watching", minDuration: 1, maxDuration: 3 },
    { name: "moving", minDuration: 1, maxDuration: 2 },
  ]);
  const second = createAnimalRoutine(42, [
    { name: "watching", minDuration: 1, maxDuration: 3 },
    { name: "moving", minDuration: 1, maxDuration: 2 },
  ]);
  // The initial duration and attention bias are deterministic for this seed.
  expect(first.current()).toEqual(second.current());
  // Advancing both by the same time retains exact agreement.
  expect(first.advance(1.25)).toEqual(second.advance(1.25));
  // A large frame safely crosses phases and begins a later varied cycle.
  const later = first.advance(8);
  expect(later.cycleIndex).toBeGreaterThan(0);
  expect(later.progress).toBeGreaterThanOrEqual(0);
  expect(later.progress).toBeLessThanOrEqual(1);
});

// Separate mounted animals should not receive the same pauses and attention choices.
test("different personality seeds produce different anticipation", () => {
  // The same species schedule isolates personality as the only difference.
  const phases = [
    { name: "resting", minDuration: 2, maxDuration: 7 },
    { name: "exploring", minDuration: 3, maxDuration: 5 },
  ] as const;
  const shy = createAnimalRoutine(7, phases).current();
  const bold = createAnimalRoutine(91, phases).current();
  // At least duration and directional bias should diverge across personalities.
  expect([shy.duration, shy.variation]).not.toEqual([
    bold.duration,
    bold.variation,
  ]);
});
