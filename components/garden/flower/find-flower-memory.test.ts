// Three provides real scene objects so this test does not need a fake mesh hierarchy.
import * as THREE from "three";
// Vitest supplies the test and equality assertion functions.
import { expect, test } from "vitest";
// This public interaction rule resolves a flower from whichever visible part was hit.
import { findFlowerMemory } from "./find-flower-memory";

// Protect the resolver's promise to recognize deeply nested visible flower parts.
test("a nested flower part resolves the containing flower memory", () => {
  // Build the small memory value the containing flower exposes to the scene.
  const memory = {
    id: "bluebell",
    name: "Bluebell",
    note: "A quiet bell at the garden's edge.",
  };
  // A group represents the complete flower that owns the memory.
  const flower = new THREE.Group();
  // Store the memory in the same supported Three.js metadata field used at runtime.
  flower.userData.flower = memory;
  // An inner group represents the flower head between the root and its petals.
  const flowerHead = new THREE.Group();
  // A nested mesh represents one individual petal selected by raycasting.
  const petal = new THREE.Mesh();
  // Build the same multi-level parent relationship used by a procedural flower.
  flower.add(flowerHead);
  flowerHead.add(petal);
  // Resolving the petal should reveal its containing flower's complete memory.
  expect(findFlowerMemory(petal)).toEqual(memory);
});
