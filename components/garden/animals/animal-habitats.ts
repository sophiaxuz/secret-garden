// Three turns shared coordinate tuples into vectors used by animation modules.
import * as THREE from "three";

// A habitat point stores immutable garden X, Y, and Z coordinates in that order.
export type HabitatPoint = readonly [number, number, number];

// Most ground animals travel between two habitat anchors and then return.
type RoundTripHabitat = {
  // Start is the animal's resting anchor and initial rendered position.
  readonly start: HabitatPoint;
  // End is the second feeding, watching, or resting anchor on its route.
  readonly end: HabitatPoint;
};

// This type documents every habitat required by the garden's current inhabitants.
type AnimalHabitats = {
  // Butterflies orbit three different origins across the garden's depth.
  readonly butterflies: {
    readonly entrance: HabitatPoint;
    readonly middle: HabitatPoint;
    readonly deep: HabitatPoint;
  };
  // The robin uses two ground points and one elevated perch.
  readonly robin: {
    readonly groundStart: HabitatPoint;
    readonly groundEnd: HabitatPoint;
    readonly perch: HabitatPoint;
  };
  // Each ground animal owns one simple out-and-back habitat.
  readonly squirrel: RoundTripHabitat;
  readonly rabbit: RoundTripHabitat;
  readonly dog: RoundTripHabitat;
  readonly cat: RoundTripHabitat;
};

// Keep every world-space habitat anchor together so garden expansion changes stay local.
export const ANIMAL_HABITATS = {
  // Spread the butterflies between the entrance, middle, and deep garden.
  butterflies: {
    entrance: [-4.5, 1.25, 7.5],
    middle: [5.4, 1.55, -4.5],
    deep: [-6.5, 1.1, -13],
  },
  // The robin hops near the path before flying to its nearby branch.
  robin: {
    groundStart: [2.8, 0.23, 8],
    groundEnd: [4.1, 0.23, 6.7],
    perch: [6.2, 1.75, 4.4],
  },
  // The squirrel crosses a shaded patch on the garden's western side.
  squirrel: {
    start: [-7.2, 0.26, -4.8],
    end: [-11.5, 0.26, -1.2],
  },
  // The rabbit moves between two sunny feeding patches near the entrance.
  rabbit: {
    start: [8, 0.26, 4.8],
    end: [11.2, 0.26, 8.3],
  },
  // The dog patrols the open western area beside the front path.
  dog: {
    start: [-9.5, 0.46, 8.3],
    end: [-5.2, 0.46, 11],
  },
  // The cat prowls between two quiet anchors in the deeper eastern garden.
  cat: {
    start: [9.4, 0.4, -10],
    end: [5.8, 0.4, -16.5],
  },
} as const satisfies AnimalHabitats;

// Convert one immutable data point into an animation-friendly Three.js vector.
export function createHabitatVector(point: HabitatPoint): THREE.Vector3 {
  // Spread the tuple into the vector constructor without changing the shared data.
  return new THREE.Vector3(...point);
}

// Prepare the vectors and headings shared by every out-and-back animal behavior.
export function createRoundTripRoute(habitat: RoundTripHabitat) {
  // Convert each data anchor once when the importing animal module initializes.
  const start = createHabitatVector(habitat.start);
  const end = createHabitatVector(habitat.end);
  // Point from the resting anchor toward the far habitat anchor.
  const outboundHeading = Math.atan2(end.x - start.x, end.z - start.z);
  // Reverse that direction for the animal's return journey.
  const returnHeading = Math.atan2(start.x - end.x, start.z - end.z);
  // Return every derived route value behind one reusable interface.
  return { start, end, outboundHeading, returnHeading };
}
