// Fiber exposes the renderer and one lightweight shadow-refresh frame callback.
import { useFrame, useThree } from "@react-three/fiber";
// React supplies the child type plus traversal and renderer lifecycle effects.
import { type ReactNode, useEffect, useLayoutEffect, useRef } from "react";
// Three.js types let this cross-cutting policy recognize renderable meshes.
import { Group, Mesh } from "three";
// The pure policy keeps tiny detail meshes out of the expensive shadow pass.
import {
  GARDEN_SHADOW_REFRESH_INTERVAL_SECONDS,
  shouldGardenMeshCastShadow,
  shouldRefreshGardenShadow,
} from "./garden-shadow-policy";

// Describe the world content and the value that signals newly planted meshes.
type GardenShadowGroupProps = {
  // Any physical scene objects can live beneath this shadow policy.
  children: ReactNode;
  // Changing this value reapplies the policy after procedural flora is added.
  refreshKey: number;
};

// Apply one shadow budget while preserving deliberate silhouette-level opt-ins.
export function GardenShadowGroup({
  children,
  refreshKey,
}: GardenShadowGroupProps) {
  // This reference exposes the mounted Three.js group after reconciliation.
  const groupRef = useRef<Group>(null);
  // Accumulated time decouples slow natural shadow motion from camera frame rate.
  const shadowElapsed = useRef(0);
  // The WebGL shadow map supports explicit refreshes without rerendering the scene.
  const { gl } = useThree();

  // Disable automatic every-frame shadow painting while this world is mounted.
  useEffect(() => {
    // Preserve the previous renderer policy in case this scene is later replaced.
    const previousAutoUpdate = gl.shadowMap.autoUpdate;
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    // Restore the renderer rather than leaking a garden-specific global setting.
    return () => {
      gl.shadowMap.autoUpdate = previousAutoUpdate;
      gl.shadowMap.needsUpdate = true;
    };
  }, [gl]);

  // Refresh living shadows at ten Hertz while camera rendering remains full speed.
  useFrame((_, delta) => {
    shadowElapsed.current += Math.min(delta, 0.25);
    if (!shouldRefreshGardenShadow(shadowElapsed.current)) return;
    gl.shadowMap.needsUpdate = true;
    shadowElapsed.current %= GARDEN_SHADOW_REFRESH_INTERVAL_SECONDS;
  });

  // Traverse after children mount so every physical mesh receives the policy.
  useLayoutEffect(() => {
    // The group can be absent during teardown, so guard before traversing it.
    if (!groupRef.current) return;
    // Visit every descendant, including instanced grass and nested animal parts.
    groupRef.current.traverse((object) => {
      // Lights, groups, and cameras do not have geometry that can cast a shadow.
      if (!(object instanceof Mesh)) return;
      // Preserve explicit castShadow props while honoring terrain and foliage opt-outs.
      object.castShadow = shouldGardenMeshCastShadow({
        castShadow: object.castShadow,
        visible: object.visible,
        shadowCaster: object.userData.shadowCaster,
      });
    });
    // Newly planted silhouette meshes should appear in the very next shadow map.
    gl.shadowMap.needsUpdate = true;
  }, [gl, refreshKey]);

  // The group adds no visual transform; it only defines the traversal boundary.
  return <group ref={groupRef}>{children}</group>;
}
