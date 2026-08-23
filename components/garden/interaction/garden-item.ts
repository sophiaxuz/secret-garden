// These are the kinds of living garden objects a visitor can currently inspect.
export type GardenItemKind = "flower" | "tree" | "animal";

// These descriptive fields are shared by identified garden life and flower memory data.
export type GardenItemDetails = {
  // Id uniquely identifies one inspectable object across the complete garden.
  id: string;
  // Name is the friendly species or landmark name shown to the visitor.
  name: string;
  // A botanical name is optional for unidentified or imagined garden life.
  latinName?: string;
  // The note gives the object a small piece of personality or history.
  note: string;
};

// A flower item fixes its discriminator so tree data cannot enter flower modules.
export type FlowerItem = GardenItemDetails & { kind: "flower" };

// A tree item fixes its discriminator so flower data cannot enter tree modules.
export type TreeItem = GardenItemDetails & { kind: "tree" };

// An animal item fixes its discriminator for every moving garden inhabitant.
export type AnimalItem = GardenItemDetails & { kind: "animal" };

// This discriminated union crosses the seam between 3D life and the HTML card.
export type GardenItem = FlowerItem | TreeItem | AnimalItem;

// Each kind owns the few words that frame targeting and inspection consistently.
export const GARDEN_ITEM_LANGUAGE = {
  // Flowers remain personal memories gathered into the garden.
  flower: {
    prompt: "press E or click to remember",
    kicker: "A living memory",
  },
  // Trees invite the visitor to pause and listen to an older presence.
  tree: {
    prompt: "press E or click to listen",
    kicker: "A rooted presence",
  },
  // Animals are encountered as fellow inhabitants rather than collected memories.
  animal: {
    prompt: "press E or click to say hello",
    kicker: "A garden companion",
  },
} satisfies Record<
  GardenItemKind,
  { readonly prompt: string; readonly kicker: string }
>;
