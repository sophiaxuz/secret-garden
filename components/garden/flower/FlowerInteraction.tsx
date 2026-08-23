// React Three Fiber calls `useFrame` during the 3D render loop.
import { useFrame, useThree } from "@react-three/fiber";
// React hooks retain interaction state and manage browser event listeners.
import { useCallback, useEffect, useRef, useState } from "react";
// Three provides raycasting, vectors, and scene-object types.
import * as THREE from "three";
// Every interactive flower exposes the same small memory shape.
import type { FlowerMemory } from "./flower-memory";
// This tested rule resolves a flower memory from any of its nested visible parts.
import { findFlowerMemory } from "./find-flower-memory";

// These callbacks let this module report results without owning the HTML UI.
type FlowerInteractionProps = {
  // Disable targeting before the visitor enters the garden.
  active: boolean;
  // Report the flower under the desktop reticle.
  onTargetChange: (flower: FlowerMemory | null) => void;
  // Report an explicit click, tap, or E-key inspection.
  onInspect: (flower: FlowerMemory) => void;
};

// Turn first-person aiming and direct touch taps into flower inspections.
export function FlowerInteraction({
  active,
  onTargetChange,
  onInspect,
}: FlowerInteractionProps) {
  // Read the live camera, scene, and canvas from the surrounding Canvas.
  const { camera, scene, gl } = useThree();
  // Reuse one raycaster instead of allocating one every frame.
  const raycaster = useRef(new THREE.Raycaster());
  // `(0, 0)` is the exact center of normalized screen coordinates.
  const screenCenter = useRef(new THREE.Vector2(0, 0));
  // Keep the current desktop target available to event handlers.
  const currentTarget = useRef<FlowerMemory | null>(null);
  // Remember where a touch began so dragging is not mistaken for tapping.
  const touchStart = useRef<[number, number] | null>(null);
  // Throttle desktop raycasts to ten checks per second.
  const lastRaycastAt = useRef(0);
  // Touch devices use tap coordinates instead of the hidden center reticle.
  const [touchDevice, setTouchDevice] = useState(false);

  // Cast a ray at any normalized screen coordinate and inspect only its first hit.
  const flowerAt = useCallback(
    (screenPosition: THREE.Vector2) => {
      // Limit interaction to nearby flowers.
      raycaster.current.far = 4.5;
      // Build a world-space ray from the camera through the requested point.
      raycaster.current.setFromCamera(screenPosition, camera);
      // Three returns intersections from nearest to farthest.
      const nearest = raycaster.current.intersectObjects(
        scene.children,
        true,
      )[0];
      // Respect occlusion: scenery in front of a flower blocks interaction.
      return findFlowerMemory(nearest?.object ?? null);
    },
    [camera, scene],
  );

  // Detect which targeting style the current device needs.
  useEffect(() => {
    // A coarse pointer normally represents a finger rather than a mouse.
    setTouchDevice(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  // Update the highlighted desktop flower at a controlled frequency.
  useFrame(({ clock }) => {
    // Touch visitors select directly by tapping, so no hidden-center scan is needed.
    if (!active || touchDevice) {
      if (currentTarget.current) {
        currentTarget.current = null;
        onTargetChange(null);
      }
      return;
    }
    // Skip work until one tenth of a second has elapsed.
    if (clock.elapsedTime - lastRaycastAt.current < 0.1) return;
    // Record this scan time for the next throttle check.
    lastRaycastAt.current = clock.elapsedTime;
    // Find the nearest visible flower beneath the reticle.
    const flower = flowerAt(screenCenter.current);
    // Avoid a React render when the target did not change.
    if (flower?.id === currentTarget.current?.id) return;
    // Store and report the new target.
    currentTarget.current = flower;
    onTargetChange(flower);
  });

  // Convert mouse, keyboard, and touch input into explicit inspection actions.
  useEffect(() => {
    // Inspect the centered desktop flower when one exists.
    const inspectCurrent = (event?: Event) => {
      if (!active || !currentTarget.current) return;
      // Prevent Drei's document click listener from immediately re-locking the mouse.
      event?.stopPropagation();
      onInspect(currentTarget.current);
    };
    // E provides a game-like keyboard alternative to clicking.
    const inspectWithKeyboard = (event: KeyboardEvent) => {
      if (event.code === "KeyE") inspectCurrent(event);
    };
    // Route the earliest reliable pointer event by input type.
    const beginPointer = (event: PointerEvent) => {
      // Pointer-locked mice reliably emit pointerdown even when click is absent.
      if (event.pointerType === "mouse" && event.button === 0) {
        inspectCurrent(event);
        return;
      }
      // Touch needs a starting point so release can distinguish tap from drag.
      if (event.pointerType === "touch") {
        touchStart.current = [event.clientX, event.clientY];
      }
    };
    // Inspect the flower at the actual tap coordinate when the finger did not drag.
    const finishTouch = (event: PointerEvent) => {
      if (event.pointerType !== "touch" || !touchStart.current || !active)
        return;
      // Measure how far the finger moved between press and release.
      const distance = Math.hypot(
        event.clientX - touchStart.current[0],
        event.clientY - touchStart.current[1],
      );
      // Clear the stored point before any inspection changes React state.
      touchStart.current = null;
      // A longer movement was a look gesture rather than a tap.
      if (distance > 10) return;
      // Convert browser pixels into Three.js coordinates ranging from -1 to 1.
      const bounds = gl.domElement.getBoundingClientRect();
      const point = new THREE.Vector2(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      // Inspect only when the tapped visible object is a nearby flower.
      const flower = flowerAt(point);
      if (flower) onInspect(flower);
    };
    // Pointerdown works for a locked mouse and also begins touch gestures.
    gl.domElement.addEventListener("pointerdown", beginPointer);
    gl.domElement.addEventListener("pointerup", finishTouch);
    // Keyboard events continue to work while pointer lock is active.
    window.addEventListener("keydown", inspectWithKeyboard);
    // Remove every listener when dependencies change or the module unmounts.
    return () => {
      gl.domElement.removeEventListener("pointerdown", beginPointer);
      gl.domElement.removeEventListener("pointerup", finishTouch);
      window.removeEventListener("keydown", inspectWithKeyboard);
    };
  }, [active, flowerAt, gl, onInspect]);

  // This module changes behavior but does not render geometry itself.
  return null;
}
