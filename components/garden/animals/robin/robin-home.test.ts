// Vitest protects the robin's homecoming promise independently from WebGL.
import { expect, test } from "vitest";
// Home selection is the small behavior seam that owns nest return frequency.
import { ROBIN_HOME_TREE_INDEX, selectRobinPerchIndex } from "./robin-home";

// Exploring should add variety without allowing permanent disappearance from home.
test("the robin returns to its home tree every third visit", () => {
  // Sample several complete home-away-away patterns with one fixed personality offset.
  const visits = Array.from({ length: 9 }, (_, cycleIndex) =>
    selectRobinPerchIndex(cycleIndex, 4),
  );
  // Multiples of three are the stable, predictable homecoming moments.
  expect(visits[0]).toBe(ROBIN_HOME_TREE_INDEX);
  expect(visits[3]).toBe(ROBIN_HOME_TREE_INDEX);
  expect(visits[6]).toBe(ROBIN_HOME_TREE_INDEX);
  // Every intervening visit must explore a different tree rather than remaining home.
  expect(visits[1]).not.toBe(ROBIN_HOME_TREE_INDEX);
  expect(visits[2]).not.toBe(ROBIN_HOME_TREE_INDEX);
  expect(visits[4]).not.toBe(ROBIN_HOME_TREE_INDEX);
});
