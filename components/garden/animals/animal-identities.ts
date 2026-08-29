// AnimalItem is the shared identity shape understood by garden interaction.
import type { AnimalItem } from "../interaction/garden-item";

// Every animated animal accepts the same identity and targeting state.
export type AnimatedAnimalProps = {
  // Animation can be disabled for visitors who request reduced motion.
  animated?: boolean;
  // Item supplies the name and story exposed through interaction.
  item: AnimalItem;
  // The current reticle target receives a warm local glow.
  highlighted?: boolean;
};

// This type documents every identity required by GardenAnimals' inhabitants.
type AnimalIdentities = {
  // Three individually colored butterflies follow separate garden routes.
  readonly butterflies: {
    readonly entrance: AnimalItem;
    readonly middle: AnimalItem;
    readonly deep: AnimalItem;
  };
  // Each larger animal appears once and owns one stable identity.
  readonly robin: AnimalItem;
  readonly squirrel: AnimalItem;
  readonly rabbit: AnimalItem;
  readonly dog: AnimalItem;
  readonly cat: AnimalItem;
};

// Keep the complete cast together so names and stories remain easy to discover.
export const ANIMAL_IDENTITIES = {
  // Give every butterfly its own species, color relationship, and temperament.
  butterflies: {
    entrance: {
      kind: "animal",
      id: "luma-brimstone",
      name: "Luma, the brimstone",
      latinName: "Gonepteryx rhamni",
      note: "She loops through the entrance light as if drawing it into the garden.",
    },
    middle: {
      kind: "animal",
      id: "skye-holly-blue",
      name: "Skye, the holly blue",
      latinName: "Celastrina argiolus",
      note: "A flicker of blue that never takes quite the same path twice.",
    },
    deep: {
      kind: "animal",
      id: "poppy-painted-lady",
      name: "Poppy, the painted lady",
      latinName: "Vanessa cardui",
      note: "She carries a little warmth into the garden's deepest corner.",
    },
  },
  // The robin's bright breast makes him the meadow's tiny morning keeper.
  robin: {
    kind: "animal",
    id: "pip-robin",
    name: "Pip, the robin",
    latinName: "Erithacus rubecula",
    note: "He hops ahead, then waits on his branch to see whether you follow.",
  },
  // The squirrel's pauses and quick bounds suggest an alert forager.
  squirrel: {
    kind: "animal",
    id: "hazel-squirrel",
    name: "Hazel, the squirrel",
    latinName: "Sciurus vulgaris",
    note: "She remembers every hidden seed and checks each secret twice.",
  },
  // The rabbit's listening poses make a shy but curious garden companion.
  rabbit: {
    kind: "animal",
    id: "clover-rabbit",
    name: "Clover, the rabbit",
    latinName: "Oryctolagus cuniculus",
    note: "He grows still when you approach, but his ears keep listening.",
  },
  // The dog's relaxed patrol reads as friendly guardianship.
  dog: {
    kind: "animal",
    id: "moss-dog",
    name: "Moss, the garden dog",
    latinName: "Canis lupus familiaris",
    note: "He knows every corner of the meadow and is delighted that you are here.",
  },
  // The cat's deep route and quiet watching give her a private, observant voice.
  cat: {
    kind: "animal",
    id: "mallow-cat",
    name: "Mallow, the garden cat",
    latinName: "Felis catus",
    note: "She notices everything, and reveals almost none of what she knows.",
  },
} as const satisfies AnimalIdentities;
