// Three provides real scene objects so the test exercises the public resolver seam.
import * as THREE from "three";
// Vitest supplies the test and equality assertion functions.
import { expect, test } from "vitest";
// This resolver should identify any inspectable life from one of its nested parts.
import { findGardenItem } from "./find-garden-item";

// Protect the shared resolver behavior for both current kinds of garden life.
test.each([
  {
    kind: "flower" as const,
    id: "bluebell",
    name: "Bluebell",
    note: "A quiet bell at the garden's edge.",
  },
  {
    kind: "tree" as const,
    id: "threshold-oak",
    name: "Threshold oak",
    note: "The first tree to greet a visitor.",
  },
])("a nested $kind part resolves its garden identity", (item) => {
  // The outer group represents one complete inspectable flower or tree.
  const gardenLife = new THREE.Group();
  // Store identity in the same supported metadata field used by the rendered scene.
  gardenLife.userData.gardenItem = item;
  // An inner group represents nested procedural geometry.
  const innerGroup = new THREE.Group();
  // A mesh represents the exact hit volume selected by raycasting.
  const hitVolume = new THREE.Mesh();
  // Reproduce the parent chain shared by tree and flower scene modules.
  gardenLife.add(innerGroup);
  innerGroup.add(hitVolume);
  // Resolving the nested target should reveal the containing garden identity.
  expect(findGardenItem(hitVolume)).toEqual(item);
});
