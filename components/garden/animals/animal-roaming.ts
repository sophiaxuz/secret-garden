// Three vectors let the pure route planner hand positions directly to render code.
import * as THREE from "three";
// Garden dimensions keep every roaming destination inside the visible world.
import { GARDEN_LAYOUT } from "../garden-layout";
// Rendered tree placement prevents a destination appearing inside a trunk.
import { GARDEN_TREES, TREE_TRUNK_RADIUS } from "../flora/garden-trees";
// Habitat points are the shared immutable world-coordinate vocabulary.
import type { HabitatPoint } from "./animal-habitats";

// Leave enough room for an animal's complete body at the garden boundary.
const EDGE_CLEARANCE = 1.35;
// This extra radius keeps resting animals visibly separate from tree bark.
const TREE_CLEARANCE = 0.9;
// Consecutive choices should produce a journey rather than a tiny shuffle.
const MINIMUM_JOURNEY = 5;

// A route exposes stable destinations and the geometry needed to travel between them.
export type AnimalRoamingRoute = {
  // Point returns the same cached world position whenever an index is revisited.
  point: (index: number) => THREE.Vector3;
  // Heading points an animal from one selected destination toward another.
  heading: (fromIndex: number, toIndex: number) => number;
};

// A radical inverse spreads successive values evenly instead of clustering them.
function radicalInverse(value: number, base: number): number {
  // Result accumulates the reversed digits as a zero-to-one fraction.
  let result = 0;
  // Place starts at the first fractional digit for the requested numeric base.
  let place = 1 / base;
  // Remaining is consumed one base digit at a time.
  let remaining = Math.max(1, Math.floor(value));
  // Reverse every digit into the fractional side of the number.
  while (remaining > 0) {
    // Add this least-significant digit at the current fractional place.
    result += (remaining % base) * place;
    // Remove the digit that was just consumed.
    remaining = Math.floor(remaining / base);
    // Move one fractional place farther from the decimal point.
    place /= base;
  }
  // The completed fraction is deterministic and always below one.
  return result;
}

// Check a candidate against the same trees visitors see in the rendered garden.
function isClearOfTrees(point: HabitatPoint): boolean {
  // Every tree contributes its scaled visible trunk plus animal body clearance.
  return GARDEN_TREES.every(({ position, scale }) => {
    // Measure only the horizontal ground-plane distance.
    const distance = Math.hypot(point[0] - position[0], point[2] - position[2]);
    // A safe destination never overlaps bark even when the animal turns around.
    return distance >= TREE_TRUNK_RADIUS * scale + TREE_CLEARANCE;
  });
}

// Create a repeatable, garden-wide route from one visit-specific personality seed.
export function createAnimalRoamingRoute(
  seed: number,
  home: HabitatPoint,
): AnimalRoamingRoute {
  // Cache vectors so animation frames never allocate the same waypoint twice.
  const points = new Map<number, THREE.Vector3>();
  // The home point makes the first journey begin exactly at the authored habitat.
  points.set(0, new THREE.Vector3(...home));
  // Convert arbitrary seeds into a positive offset through the low-discrepancy field.
  const seedOffset = 1 + (Math.floor(Math.abs(seed) * 97) % 997);

  // Select one safe, well-distributed destination for a positive journey index.
  function point(index: number): THREE.Vector3 {
    // Negative requests are normalized so callers cannot create a second timeline.
    const safeIndex = Math.max(0, Math.floor(index));
    // Reuse a destination once chosen to keep a journey still between frames.
    const cached = points.get(safeIndex);
    if (cached) return cached;
    // Resolve the preceding point first so short, uninteresting journeys can be rejected.
    const previous = point(safeIndex - 1);
    // Work within an inset rectangle rather than allowing bodies to clip the edge.
    const minimumX = GARDEN_LAYOUT.bounds.minX + EDGE_CLEARANCE;
    const maximumX = GARDEN_LAYOUT.bounds.maxX - EDGE_CLEARANCE;
    const minimumZ = GARDEN_LAYOUT.bounds.minZ + EDGE_CLEARANCE;
    const maximumZ = GARDEN_LAYOUT.bounds.maxZ - EDGE_CLEARANCE;
    // Keep the last candidate as a defensive fallback after the bounded search.
    let selected: HabitatPoint = [home[0], home[1], home[2]];

    // Alternate prime-base sequences cover the whole garden while retries avoid trees.
    for (let attempt = 0; attempt < 24; attempt += 1) {
      // A large retry step changes both coordinates rather than nudging one point.
      const sequenceIndex = seedOffset + safeIndex * 17 + attempt * 101;
      // Base two distributes destinations across the full east-west garden width.
      const x = THREE.MathUtils.lerp(
        minimumX,
        maximumX,
        radicalInverse(sequenceIndex, 2),
      );
      // Base three independently distributes them from entrance to deep garden.
      const z = THREE.MathUtils.lerp(
        minimumZ,
        maximumZ,
        radicalInverse(sequenceIndex, 3),
      );
      // Preserve the species' authored ground or flight height.
      const candidate: HabitatPoint = [x, home[1], z];
      // Measure horizontal travel from the animal's previous destination.
      const journeyLength = Math.hypot(x - previous.x, z - previous.z);
      // Remember a valid in-bounds fallback even when it is closer than preferred.
      if (isClearOfTrees(candidate)) selected = candidate;
      // Accept only safe destinations that create a clearly visible journey.
      if (isClearOfTrees(candidate) && journeyLength >= MINIMUM_JOURNEY) break;
    }

    // Store one mutable vector privately while exposing it as route-owned state.
    const destination = new THREE.Vector3(...selected);
    points.set(safeIndex, destination);
    // Return the stable destination used by every frame in this journey.
    return destination;
  }

  // Face from one route point toward another on the horizontal garden plane.
  function heading(fromIndex: number, toIndex: number): number {
    // Resolve both cached points through the same safe selection process.
    const from = point(fromIndex);
    const to = point(toIndex);
    // Three.js yaw uses X as the first atan2 input and Z as the second.
    return Math.atan2(to.x - from.x, to.z - from.z);
  }

  // Keep route state behind a small interface shared by every animal species.
  return { point, heading };
}

// Place an animal on a gently bowed journey between two roaming destinations.
export function placeAlongRoamingJourney(
  position: THREE.Vector3,
  from: THREE.Vector3,
  to: THREE.Vector3,
  progress: number,
  bend: number,
): void {
  // Smooth acceleration and arrival keep long journeys from looking mechanical.
  const eased = THREE.MathUtils.smoothstep(progress, 0, 1);
  // Begin with the direct interpolation so both exact endpoints remain continuous.
  position.lerpVectors(from, to, eased);
  // Measure the horizontal direction to construct its perpendicular curve.
  const movementX = to.x - from.x;
  const movementZ = to.z - from.z;
  // Guard an identical-point journey before normalizing its direction.
  const movementLength = Math.max(0.001, Math.hypot(movementX, movementZ));
  // A sine envelope is zero at both ends and widest halfway through the route.
  const curve = Math.sin(eased * Math.PI) * bend;
  // Offset sideways, never vertically, so feet remain attached to the ground.
  position.x += (movementZ / movementLength) * curve;
  position.z -= (movementX / movementLength) * curve;
}
