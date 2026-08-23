// Three supplies real scene objects for the registry's public raycasting interface.
import * as THREE from "three";
// Vitest supplies the test and collection assertions.
import { expect, test } from "vitest";
// The registry is the public seam shared by all inspectable garden life.
import { createGardenInteractionRegistry } from "./GardenInteractionRegistry";

// Protect mixed registration and cleanup without inspecting registry internals.
test("the registry raycasts active flower, tree, and moving animal targets", () => {
  // Create one registry like the provider creates for the mounted garden.
  const registry = createGardenInteractionRegistry();
  // Represent a flower hit volume directly in front of the visitor.
  const flowerTarget = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  // Production hit volumes are hidden visually but remain directly raycastable.
  flowerTarget.visible = false;
  // Place the flower within the interaction range.
  flowerTarget.position.z = -2;
  // Update its transform as the live Three.js scene does before raycasting.
  flowerTarget.updateMatrixWorld();
  // Represent a larger tree hit volume farther along the same ray.
  const treeTarget = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2));
  // Match the tree's production target instead of relying on visible test meshes.
  treeTarget.visible = false;
  // Keep enough separation for both targets to produce distinct intersections.
  treeTarget.position.z = -4;
  // Update the tree transform before sending it through the public interface.
  treeTarget.updateMatrixWorld();
  // Represent an animal hit volume that can change position after registration.
  const animalTarget = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5));
  // Production animal targets are also hidden while remaining raycastable.
  animalTarget.visible = false;
  // Place the animal farther along the same view ray initially.
  animalTarget.position.z = -6;
  // Publish its first world transform before the initial raycast.
  animalTarget.updateMatrixWorld();
  // Aim a real ray through all three registered forms of garden life.
  const raycaster = new THREE.Raycaster(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
    0,
    8,
  );
  // Register every target and retain their independent cleanup functions.
  const unregisterFlower = registry.register(flowerTarget);
  const unregisterTree = registry.register(treeTarget);
  const unregisterAnimal = registry.register(animalTarget);
  // All subjects should be returned from nearest to farthest.
  expect([
    ...new Set(registry.raycast(raycaster).map((hit) => hit.object)),
  ]).toEqual([flowerTarget, treeTarget, animalTarget]);
  // Move the registered animal away like a live render-loop update would.
  animalTarget.position.x = 5;
  animalTarget.updateMatrixWorld();
  // The registry should now miss the animal without requiring re-registration.
  expect([
    ...new Set(registry.raycast(raycaster).map((hit) => hit.object)),
  ]).toEqual([flowerTarget, treeTarget]);
  // Move the animal back before checking independent cleanup behavior.
  animalTarget.position.x = 0;
  animalTarget.updateMatrixWorld();
  // Removing only the flower must leave tree and animal independently inspectable.
  unregisterFlower();
  expect([
    ...new Set(registry.raycast(raycaster).map((hit) => hit.object)),
  ]).toEqual([treeTarget, animalTarget]);
  // Removing both remaining targets leaves no stale scene objects behind.
  unregisterTree();
  unregisterAnimal();
  expect(registry.raycast(raycaster)).toEqual([]);
});
