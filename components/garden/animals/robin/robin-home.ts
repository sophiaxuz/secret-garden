// Habitat data names the robin's permanent home tree in domain language.
import { ANIMAL_HABITATS, type HabitatPoint } from "../animal-habitats";
// Render data supplies real branch positions for both home and away visits.
import {
  GARDEN_TREES,
  TREE_BRANCH_PERCH_LOCAL_POSITION,
} from "../../flora/garden-trees";

// Find the home tree once and fail clearly if its named habitat ever becomes stale.
export const ROBIN_HOME_TREE_INDEX = GARDEN_TREES.findIndex(
  ({ item }) => item.id === ANIMAL_HABITATS.robin.homeTreeId,
);
// A missing home should stop development rather than silently invent a coordinate.
if (ROBIN_HOME_TREE_INDEX < 0) {
  throw new Error(
    `Robin home tree "${ANIMAL_HABITATS.robin.homeTreeId}" is missing.`,
  );
}

// Convert every scaled local branch perch into an immutable world-space point.
export const ROBIN_TREE_PERCHES: readonly HabitatPoint[] = GARDEN_TREES.map(
  ({ position, scale }) => [
    // X follows the physical branch outward from its tree trunk.
    position[0] + TREE_BRANCH_PERCH_LOCAL_POSITION[0] * scale,
    // Y places the robin above the branch so its feet visually meet the wood.
    position[1] + TREE_BRANCH_PERCH_LOCAL_POSITION[1] * scale,
    // The shared branch currently extends along local X, retaining the tree's Z.
    position[2] + TREE_BRANCH_PERCH_LOCAL_POSITION[2] * scale,
  ],
);

// The nest rests just beneath the robin's body centre at the permanent home perch.
export const ROBIN_NEST_POSITION: HabitatPoint = [
  ROBIN_TREE_PERCHES[ROBIN_HOME_TREE_INDEX][0],
  ROBIN_TREE_PERCHES[ROBIN_HOME_TREE_INDEX][1] - 0.18,
  ROBIN_TREE_PERCHES[ROBIN_HOME_TREE_INDEX][2],
];

// Select changing away branches while guaranteeing a regular return to the nest.
export function selectRobinPerchIndex(
  cycleIndex: number,
  awayOffset: number,
): number {
  // Every third tree visit is a deliberate homecoming, beginning with the first.
  if (cycleIndex % 3 === 0) return ROBIN_HOME_TREE_INDEX;
  // Home is removed from the away pool so an exploration visit is genuinely away.
  const awayIndices = GARDEN_TREES.map((_, index) => index).filter(
    (index) => index !== ROBIN_HOME_TREE_INDEX,
  );
  // Normalize both inputs before rotating deterministically through away trees.
  const selection = Math.abs(Math.floor(awayOffset + cycleIndex));
  // Return one valid rendered-tree index from the non-home pool.
  return awayIndices[selection % awayIndices.length];
}
