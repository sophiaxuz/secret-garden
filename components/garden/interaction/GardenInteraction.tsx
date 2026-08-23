// React Three Fiber calls `useFrame` during the 3D render loop.
import { useFrame, useThree } from "@react-three/fiber";
// React hooks retain interaction state and manage browser event listeners.
import { useCallback, useEffect, useRef, useState } from "react";
// Three provides raycasting, vectors, and scene-object types.
import * as THREE from "three";
// This tested rule resolves identity from a registered garden hit volume.
import { findGardenItem } from "./find-garden-item";
// The registry exposes only inexpensive inspectable hit volumes to the raycaster.
import { useGardenInteractionRegistry } from "./GardenInteractionRegistry";
// All inspectable garden life crosses this seam with the same small data shape.
import type { GardenItem } from "./garden-item";

// These callbacks report targeting results without coupling behavior to HTML UI.
type GardenInteractionProps = {
  // Disable targeting before entry or while an inspection card is open.
  active: boolean;
  // Report the garden life beneath the desktop reticle.
  onTargetChange: (item: GardenItem | null) => void;
  // Report an explicit click, tap, or E-key inspection.
  onInspect: (item: GardenItem) => void;
};

// Turn first-person aiming and direct touch taps into garden inspections.
export function GardenInteraction({
  active,
  onTargetChange,
  onInspect,
}: GardenInteractionProps) {
  // Read the live camera and canvas from the surrounding Canvas.
  const { camera, gl } = useThree();
  // Read the stable list of registered garden-life hit volumes.
  const interactionRegistry = useGardenInteractionRegistry();
  // Reuse one raycaster instead of allocating one every frame.
  const raycaster = useRef(new THREE.Raycaster());
  // `(0, 0)` is the exact center of normalized screen coordinates.
  const screenCenter = useRef(new THREE.Vector2(0, 0));
  // Keep the current desktop target available to event handlers.
  const currentTarget = useRef<GardenItem | null>(null);
  // Remember where a touch began so dragging is not mistaken for tapping.
  const touchStart = useRef<[number, number] | null>(null);
  // Throttle desktop raycasts to ten checks per second.
  const lastRaycastAt = useRef(0);
  // Touch devices use tap coordinates instead of the hidden center reticle.
  const [touchDevice, setTouchDevice] = useState(false);

  // Cast a ray at one screen coordinate and resolve only its nearest target.
  const itemAt = useCallback(
    (screenPosition: THREE.Vector2) => {
      // Limit interaction to garden life close enough to notice intimately.
      raycaster.current.far = 4.5;
      // Build a world-space ray from the camera through the requested point.
      raycaster.current.setFromCamera(screenPosition, camera);
      // Search registered hit volumes instead of traversing the complete scene.
      const nearest = interactionRegistry.raycast(raycaster.current)[0];
      // Resolve identity stored on the nearest target's containing scene group.
      return findGardenItem(nearest?.object ?? null);
    },
    [camera, interactionRegistry],
  );

  // Detect which targeting style the current device needs.
  useEffect(() => {
    // A coarse pointer normally represents a finger rather than a mouse.
    setTouchDevice(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  // Update the highlighted desktop target at a controlled frequency.
  useFrame(({ clock }) => {
    // Touch visitors select directly by tapping, so no center scan is needed.
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
    // Find the nearest registered garden life beneath the reticle.
    const item = itemAt(screenCenter.current);
    // Avoid a React render when the target did not change.
    if (item?.id === currentTarget.current?.id) return;
    // Store and report the new target.
    currentTarget.current = item;
    onTargetChange(item);
  });

  // Convert mouse, keyboard, and touch input into explicit inspections.
  useEffect(() => {
    // Inspect the centered desktop target when one exists.
    const inspectCurrent = (event?: Event) => {
      if (!active || !currentTarget.current) return;
      // Stop Drei's document click listener from immediately relocking the mouse.
      event?.stopPropagation();
      onInspect(currentTarget.current);
    };
    // E provides a game-like keyboard alternative to clicking.
    const inspectWithKeyboard = (event: KeyboardEvent) => {
      if (event.code === "KeyE") inspectCurrent(event);
    };
    // Route the earliest reliable pointer event by input type.
    const beginPointer = (event: PointerEvent) => {
      // Pointer-locked mice emit pointerdown reliably even when click is absent.
      if (event.pointerType === "mouse" && event.button === 0) {
        inspectCurrent(event);
        return;
      }
      // Touch needs a starting point so release can distinguish tap from drag.
      if (event.pointerType === "touch") {
        touchStart.current = [event.clientX, event.clientY];
      }
    };
    // Inspect the item at the tap coordinate when the finger did not drag.
    const finishTouch = (event: PointerEvent) => {
      if (event.pointerType !== "touch" || !touchStart.current || !active)
        return;
      // Measure movement between the finger's press and release.
      const distance = Math.hypot(
        event.clientX - touchStart.current[0],
        event.clientY - touchStart.current[1],
      );
      // Clear the stored point before inspection changes React state.
      touchStart.current = null;
      // A longer movement was a look gesture rather than a tap.
      if (distance > 10) return;
      // Convert browser pixels into Three.js coordinates ranging from -1 to 1.
      const bounds = gl.domElement.getBoundingClientRect();
      const point = new THREE.Vector2(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      // Inspect only when the tapped registered volume belongs to nearby life.
      const item = itemAt(point);
      if (item) onInspect(item);
    };
    // Pointerdown supports a locked mouse and begins touch gestures.
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
  }, [active, gl, itemAt, onInspect]);

  // This module changes behavior but does not render geometry itself.
  return null;
}
