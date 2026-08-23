// Vitest supplies the behavioral assertion and test function.
import { expect, test } from "vitest";
// The identity map is the public source for every inspectable animal encounter.
import { ANIMAL_IDENTITIES } from "./animal-identities";

// Protect complete coverage of the animals currently rendered by Nature.
test("every garden animal has one unique inspectable identity", () => {
  // Collect the three butterflies and five individually rendered animals.
  const animals = [
    ...Object.values(ANIMAL_IDENTITIES.butterflies),
    ANIMAL_IDENTITIES.robin,
    ANIMAL_IDENTITIES.squirrel,
    ANIMAL_IDENTITIES.rabbit,
    ANIMAL_IDENTITIES.dog,
    ANIMAL_IDENTITIES.cat,
  ];
  // These stable ids independently describe the complete current garden cast.
  expect(animals.map((animal) => animal.id)).toEqual([
    "luma-brimstone",
    "skye-holly-blue",
    "poppy-painted-lady",
    "pip-robin",
    "hazel-squirrel",
    "clover-rabbit",
    "moss-dog",
    "mallow-cat",
  ]);
  // Every entry must cross the inspection seam as animal life.
  expect(animals.every((animal) => animal.kind === "animal")).toBe(true);
});
