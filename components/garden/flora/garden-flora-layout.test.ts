// Vitest protects spacious flora composition without mounting React or WebGL.
import { expect, test } from "vitest";
// Shared bounds define the land visitors can explore among the plants and trees.
import { GARDEN_LAYOUT } from "../garden-layout";
// Generated placement must remain spacious throughout the complete capacity.
import { getPlantedFlowerPosition } from "./garden-flower-layout";
// Initial flower landmarks participate in the same overall composition contract.
import { INITIAL_FLOWERS } from "./garden-flowers";
// Tree positions define the wider outer ring around those flower landmarks.
import { GARDEN_TREES } from "./garden-trees";

// Measure horizontal distance because every tested flora item shares ground height.
function horizontalDistance(
  first: readonly [number, number, number],
  second: readonly [number, number, number],
): number {
  // X and Z alone describe separation across the flat island meadow.
  return Math.hypot(first[0] - second[0], first[2] - second[2]);
}

// Find the smallest separation among all unique pairs in one placement list.
function minimumPairDistance(
  positions: readonly (readonly [number, number, number])[],
): number {
  // Begin above every possible garden distance so the first pair can replace it.
  let minimum = Number.POSITIVE_INFINITY;
  // Visit each position once as the first member of a possible pair.
  positions.forEach((first, firstIndex) => {
    // Compare only later entries so no pair is measured twice or against itself.
    positions.slice(firstIndex + 1).forEach((second) => {
      // Retain the closest relationship found anywhere in this layout.
      minimum = Math.min(minimum, horizontalDistance(first, second));
    });
  });
  // Return the meaningful spacing used by the assertions below.
  return minimum;
}

// Authored landmarks should read as an outer tree ring with distinct flower clearings.
test("initial trees and flowers occupy broad, separated garden regions", () => {
  // Extract immutable coordinate tuples from their richer render-data records.
  const treePositions = GARDEN_TREES.map(({ position }) => position);
  const flowerPositions = INITIAL_FLOWERS.map(({ position }) => position);
  // Neighboring trees need enough space for their crowns to remain individually legible.
  expect(minimumPairDistance(treePositions)).toBeGreaterThan(12);
  // Initial flowers should appear as discoveries rather than one central bouquet.
  expect(minimumPairDistance(flowerPositions)).toBeGreaterThan(8);
  // Measure the complete east-west flower span as a direct composition safeguard.
  const flowerX = flowerPositions.map(([x]) => x);
  expect(Math.max(...flowerX) - Math.min(...flowerX)).toBeGreaterThan(22);
  // Measure entrance-to-depth coverage so the back of the island remains inhabited.
  const flowerZ = flowerPositions.map(([, , z]) => z);
  expect(Math.max(...flowerZ) - Math.min(...flowerZ)).toBeGreaterThan(30);
});

// Future memories should fill the wider meadow without crossing navigation limits.
test("the full planted-flower capacity remains distributed inside the garden", () => {
  // Generate every supported plot through the same pure function used by rendering.
  const positions = Array.from(
    { length: GARDEN_LAYOUT.plantedFlowers.capacity },
    (_, index) => getPlantedFlowerPosition(index),
  );
  // Every plot must remain on explorable land rather than entering the sea or fog.
  for (const [x, , z] of positions) {
    expect(x).toBeGreaterThan(GARDEN_LAYOUT.bounds.minX);
    expect(x).toBeLessThan(GARDEN_LAYOUT.bounds.maxX);
    expect(z).toBeGreaterThan(GARDEN_LAYOUT.bounds.minZ);
    expect(z).toBeLessThan(GARDEN_LAYOUT.bounds.maxZ);
  }
  // The whole collection should reach both sides and most of the garden's depth.
  const xValues = positions.map(([x]) => x);
  const zValues = positions.map(([, , z]) => z);
  expect(Math.max(...xValues) - Math.min(...xValues)).toBeGreaterThan(27);
  expect(Math.max(...zValues) - Math.min(...zValues)).toBeGreaterThan(31);
});
