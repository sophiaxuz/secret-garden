// Three turns shared coordinate tuples into vectors used by animation modules.
import * as THREE from "three";
// Tree ids keep climb habitats synchronized with actual named garden trees.
import type { GardenTreeId } from "../flora/garden-trees";

// A habitat point stores immutable garden X, Y, and Z coordinates in that order.
export type HabitatPoint = readonly [number, number, number];

// Ground animals need only an initial home because later places are chosen at runtime.
type RoamingHabitat = {
  // Start is the animal's first resting anchor when the garden mounts.
  readonly start: HabitatPoint;
};

// This type documents every habitat required by the garden's current inhabitants.
type AnimalHabitats = {
  // Butterflies orbit three different origins across the garden's depth.
  readonly butterflies: {
    readonly entrance: HabitatPoint;
    readonly middle: HabitatPoint;
    readonly deep: HabitatPoint;
  };
  // The robin begins here before roaming among generated patches and real trees.
  readonly robin: {
    readonly groundStart: HabitatPoint;
    // A named tree makes home permanent even if the garden layout later changes.
    readonly homeTreeId: GardenTreeId;
  };
  // The squirrel starts on the ground and names the tree it climbs.
  readonly squirrel: {
    readonly start: HabitatPoint;
    readonly treeId: GardenTreeId;
  };
  // Each remaining ground animal owns only its first garden position.
  readonly rabbit: RoamingHabitat;
  readonly dog: RoamingHabitat;
  readonly cat: RoamingHabitat;
};

// Keep every world-space habitat anchor together so garden expansion changes stay local.
export const ANIMAL_HABITATS = {
  // Spread the butterflies between the entrance, middle, and deep garden.
  butterflies: {
    entrance: [-4.5, 1.25, 7.5],
    middle: [5.4, 1.55, -4.5],
    deep: [-6.5, 1.1, -13],
  },
  // The robin first appears near the path before choosing changing destinations.
  robin: {
    groundStart: [2.8, 0.23, 8],
    // Threshold oak shelters the nest near the garden's remembered entrance.
    homeTreeId: "threshold-oak",
  },
  // The squirrel forages west of the path before climbing the nearby Moss oak.
  squirrel: {
    start: [-7.2, 0.26, -4.8],
    treeId: "moss-oak",
  },
  // The rabbit first appears at a sunny feeding patch near the entrance.
  rabbit: {
    start: [8, 0.26, 4.8],
  },
  // The dog first appears in the open western area beside the front path.
  dog: {
    start: [-9.5, 0.46, 8.3],
  },
  // The cat first appears at a quiet anchor in the deeper eastern garden.
  cat: {
    start: [9.4, 0.4, -10],
  },
} as const satisfies AnimalHabitats;

// Convert one immutable data point into an animation-friendly Three.js vector.
export function createHabitatVector(point: HabitatPoint): THREE.Vector3 {
  // Spread the tuple into the vector constructor without changing the shared data.
  return new THREE.Vector3(...point);
}
