// These are the kinds of living garden objects a visitor can currently inspect.
export type GardenItemKind = "flower" | "tree";

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

// This discriminated union crosses the seam between 3D life and the HTML card.
export type GardenItem = FlowerItem | TreeItem;
