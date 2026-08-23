// Vitest supplies the behavioral assertion and test function.
import { expect, test } from "vitest";
// The identity map is the public source for every inspectable animal encounter.
import { ANIMAL_IDENTITIES } from "./animal-identities";
// AnimalItem describes one leaf discovered inside the nested identity map.
import type { AnimalItem } from "../interaction/garden-item";

// Recognize an animal leaf while recursively walking unknown nested values.
function isAnimalItem(value: unknown): value is AnimalItem {
  // The discriminator distinguishes identity leaves from their containing groups.
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    value.kind === "animal"
  );
}

// Find identities at any depth without maintaining a second list of animal names.
function collectAnimalItems(value: unknown): AnimalItem[] {
  // A recognized identity is one complete leaf in the cast map.
  if (isAnimalItem(value)) return [value];
  // Primitive values cannot contain nested animal identities.
  if (typeof value !== "object" || value === null) return [];
  // Visit every child so future animal groups gain coverage automatically.
  return Object.values(value).flatMap(collectAnimalItems);
}

// Protect the identity map's current eight-member, unique-id contract.
test("the animal identity map contains eight unique companions", () => {
  // Discover every animal regardless of how the cast is grouped internally.
  const animals = collectAnimalItems(ANIMAL_IDENTITIES);
  // The current garden contains three butterflies and five larger animals.
  expect(animals).toHaveLength(8);
  // A set shrinks only when two identities would collide during targeting.
  expect(new Set(animals.map((animal) => animal.id)).size).toBe(8);
});
