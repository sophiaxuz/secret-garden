// Vitest protects the shadow-pass budget that keeps camera movement responsive.
import { describe, expect, it } from "vitest";
// The pure decision is shared by this test and the Three.js traversal boundary.
import {
  shouldGardenMeshCastShadow,
  shouldRefreshGardenShadow,
} from "./garden-shadow-policy";

// Shadows should describe major silhouettes without repainting every tiny mesh.
describe("shouldGardenMeshCastShadow", () => {
  // Ordinary detail meshes remain out of the expensive second rendering pass.
  it("requires a mesh to opt into shadow casting", () => {
    expect(
      shouldGardenMeshCastShadow({ castShadow: false, visible: true }),
    ).toBe(false);
    expect(
      shouldGardenMeshCastShadow({ castShadow: true, visible: true }),
    ).toBe(true);
  });

  // Explicit exclusions continue to protect terrain, grass, water, and cloud layers.
  it("honors an explicit shadow exclusion even when castShadow was enabled", () => {
    expect(
      shouldGardenMeshCastShadow({
        castShadow: true,
        visible: true,
        shadowCaster: false,
      }),
    ).toBe(false);
  });

  // Hidden raycast volumes should never enter a celestial shadow map.
  it("rejects invisible interaction geometry", () => {
    expect(
      shouldGardenMeshCastShadow({ castShadow: true, visible: false }),
    ).toBe(false);
  });
});

// Animated shadows can update less often than the camera without becoming static.
describe("shouldRefreshGardenShadow", () => {
  // A ten-Hertz shadow cadence removes most duplicate shadow renders at sixty FPS.
  it("refreshes after one tenth of a second", () => {
    expect(shouldRefreshGardenShadow(0.09)).toBe(false);
    expect(shouldRefreshGardenShadow(0.1)).toBe(true);
    expect(shouldRefreshGardenShadow(0.18)).toBe(true);
  });
});
