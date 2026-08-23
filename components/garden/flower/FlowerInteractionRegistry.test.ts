// Three supplies real scene objects for the registry contract.
import * as THREE from "three";
// Vitest supplies the test and equality assertions.
import { expect, test } from "vitest";
// The registry is the public seam between flowers and the central raycaster.
import { createFlowerInteractionRegistry } from "./FlowerInteractionRegistry";

// Protect the narrow raycast behavior and its cleanup without inspecting internals.
test("the registry raycasts only active flower targets", () => {
  // Create one registry like the provider creates for a mounted garden.
  const registry = createFlowerInteractionRegistry();
  // Represent the simple invisible box belonging to one nearby flower.
  const flowerTarget = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  // Match the production hit volume, which stays hidden from rendering.
  flowerTarget.visible = false;
  // Place that flower directly in front of the test ray.
  flowerTarget.position.z = -2;
  // Update its world matrix just as the Three.js scene does before rendering.
  flowerTarget.updateMatrixWorld();
  // Represent closer scenery that must never enter the flower-only registry.
  const tree = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  // Put the unrelated scenery directly between the ray and the flower.
  tree.position.z = -1;
  // Update this matrix so it would be hittable if the complete scene were searched.
  tree.updateMatrixWorld();
  // Aim a real Three.js ray through both objects from the origin.
  const raycaster = new THREE.Raycaster(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
    0,
    4.5,
  );
  // Register only the flower and retain the cleanup returned for unmounting.
  const unregister = registry.register(flowerTarget);
  // Ask the registry which unique objects the real ray intersects.
  const hitObjects = [
    ...new Set(registry.raycast(raycaster).map((hit) => hit.object)),
  ];
  // The closer tree is ignored because only the flower volume was registered.
  expect(hitObjects).toEqual([flowerTarget]);
  // Simulate React removing the flower from the garden.
  unregister();
  // Cleanup prevents the raycaster from retaining a stale Three.js object.
  expect(registry.raycast(raycaster)).toEqual([]);
});
