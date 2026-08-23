// Vitest supplies the test and equality assertion functions.
import { expect, test } from "vitest";
// Garden bounds define the explorable habitat that must contain every anchor.
import { GARDEN_LAYOUT } from "../garden-layout";
// The shared habitat map is the public source of all animal world positions.
import { ANIMAL_HABITATS, type HabitatPoint } from "./animal-habitats";

// Recognize coordinate tuples while recursively exploring the habitat map.
function isHabitatPoint(value: unknown): value is HabitatPoint {
  // Points contain exactly three numeric coordinates and no nested habitat groups.
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((coordinate) => typeof coordinate === "number")
  );
}

// Find every habitat point without maintaining a second list of animal names.
function collectHabitatPoints(value: unknown): HabitatPoint[] {
  // A recognized tuple is one complete leaf in the habitat tree.
  if (isHabitatPoint(value)) return [value];
  // Primitive values cannot contain any nested habitat points.
  if (typeof value !== "object" || value === null) return [];
  // Visit every child so newly added animal groups gain test coverage automatically.
  return Object.values(value).flatMap(collectHabitatPoints);
}

// Protect the invariant that every animal anchor remains inside the explorable garden.
test("all animal habitat anchors stay inside the garden", () => {
  // Discover butterfly, robin, and ground-animal anchors from the shared map itself.
  const anchors = collectHabitatPoints(ANIMAL_HABITATS);
  // Check every X and Z pair against the same bounds used by visitor navigation.
  const everyAnchorIsInside = anchors.every(
    ([x, , z]) =>
      x >= GARDEN_LAYOUT.bounds.minX &&
      x <= GARDEN_LAYOUT.bounds.maxX &&
      z >= GARDEN_LAYOUT.bounds.minZ &&
      z <= GARDEN_LAYOUT.bounds.maxZ,
  );
  // A future habitat edit now fails clearly before an animal leaves the modeled space.
  expect(everyAnchorIsInside).toBe(true);
});
