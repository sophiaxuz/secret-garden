// Three supplies real scene objects for the registry's public raycasting interface.
import * as THREE from "three";
// Vitest supplies the test and collection assertions.
import { expect, test } from "vitest";
// The registry is the public seam shared by inspectable flowers and trees.
import { createGardenInteractionRegistry } from "./GardenInteractionRegistry";

// Protect mixed registration and cleanup without inspecting registry internals.
test("the registry raycasts active flower and tree targets", () => {
  // Create one registry like the provider creates for the mounted garden.
  const registry = createGardenInteractionRegistry();
  // Represent a flower hit volume directly in front of the visitor.
  const flowerTarget = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  // Place the flower within the interaction range.
  flowerTarget.position.z = -2;
  // Update its transform as the live Three.js scene does before raycasting.
  flowerTarget.updateMatrixWorld();
  // Represent a larger tree hit volume farther along the same ray.
  const treeTarget = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2));
  // Keep enough separation for both targets to produce distinct intersections.
  treeTarget.position.z = -4;
  // Update the tree transform before sending it through the public interface.
  treeTarget.updateMatrixWorld();
  // Aim a real ray through both registered forms of garden life.
  const raycaster = new THREE.Raycaster(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
    0,
    8,
  );
  // Register both targets and retain their independent cleanup functions.
  const unregisterFlower = registry.register(flowerTarget);
  const unregisterTree = registry.register(treeTarget);
  // The nearer flower and farther tree should both be returned in distance order.
  expect([
    ...new Set(registry.raycast(raycaster).map((hit) => hit.object)),
  ]).toEqual([flowerTarget, treeTarget]);
  // Removing only the flower must leave the tree independently inspectable.
  unregisterFlower();
  expect([
    ...new Set(registry.raycast(raycaster).map((hit) => hit.object)),
  ]).toEqual([treeTarget]);
  // Removing the tree leaves no stale scene objects in the registry.
  unregisterTree();
  expect(registry.raycast(raycaster)).toEqual([]);
});
