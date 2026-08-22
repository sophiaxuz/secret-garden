// This type is the small shared interface between the 3D flower and the UI.
export type FlowerMemory = {
  // `id` uniquely identifies a flower even when two flowers share a species.
  id: string;
  // `name` is the friendly species name shown to the visitor.
  name: string;
  // `latinName` is optional because a new photograph may not be identified yet.
  latinName?: string;
  // `note` gives the flower emotional or historical context.
  note: string;
};
