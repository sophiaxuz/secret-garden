// This Drei control turns mouse movement into first-person camera rotation.
import { PointerLockControls } from "@react-three/drei";
// These hooks expose the render loop and the current Three.js renderer state.
import { useFrame, useThree } from "@react-three/fiber";
// React hooks store mutable input state and manage browser event listeners.
import { useEffect, useRef, useState } from "react";
// Three provides vectors, math helpers, and camera types used for movement.
import * as THREE from "three";

// This module translates desktop and touch input into camera movement.
export function FirstPersonControls({ active }: { active: boolean }) {
  // A Set records which movement keys are currently being held.
  const keys = useRef(new Set<string>());
  // Reusing vectors avoids allocating new objects during every animation frame.
  const forwardDirection = useRef(new THREE.Vector3());
  const rightDirection = useRef(new THREE.Vector3());
  // This stores the previous finger position while a touch drag is active.
  const touchStart = useRef<[number, number] | null>(null);
  // Touch devices need drag controls instead of browser pointer lock.
  const [touchDevice, setTouchDevice] = useState(false);
  // `camera` is the visitor's view and `gl` owns the underlying canvas element.
  const { camera, gl } = useThree();

  // Install the global keyboard listeners once when this module mounts.
  useEffect(() => {
    // A coarse pointer usually means the visitor is using touch.
    setTouchDevice(window.matchMedia("(pointer: coarse)").matches);
    // Add a pressed key unless focus belongs to an interactive HTML control.
    const down = (event: KeyboardEvent) => {
      if (
        !["INPUT", "TEXTAREA", "BUTTON"].includes(
          (event.target as HTMLElement).tagName,
        )
      ) {
        // Sets prevent duplicate entries when a key repeats while being held.
        keys.current.add(event.code);
      }
    };
    // Releasing a key removes it from the active movement set.
    const up = (event: KeyboardEvent) => keys.current.delete(event.code);
    // Losing browser focus must stop movement so a key cannot become stuck.
    const clear = () => keys.current.clear();
    // Attach all three listeners to the browser window.
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    // React calls this cleanup before unmounting the module.
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);

  // Install direct touch-drag listeners only when touch navigation is active.
  useEffect(() => {
    // Desktop or pre-entry visitors do not need these listeners.
    if (!active || !touchDevice) return;
    // The renderer's DOM element is the canvas receiving touch events.
    const element = gl.domElement;
    // Remember where the visitor first touched the canvas.
    const start = (event: TouchEvent) => {
      const touch = event.touches[0];
      touchStart.current = [touch.clientX, touch.clientY];
    };
    // Rotate the camera by the distance the finger moved.
    const move = (event: TouchEvent) => {
      // Ignore a move event when there was no matching start event.
      if (!touchStart.current) return;
      // Read the current finger coordinates.
      const touch = event.touches[0];
      // Calculate horizontal and vertical movement since the previous event.
      const dx = touch.clientX - touchStart.current[0];
      const dy = touch.clientY - touchStart.current[1];
      // YXZ rotation order keeps horizontal turning intuitive in first person.
      camera.rotation.order = "YXZ";
      // Horizontal dragging turns the visitor left or right.
      camera.rotation.y -= dx * 0.004;
      // Vertical dragging looks up or down, clamped to prevent flipping over.
      camera.rotation.x = THREE.MathUtils.clamp(
        camera.rotation.x - dy * 0.003,
        -1.1,
        1.1,
      );
      // Use the current point as the start of the next movement calculation.
      touchStart.current = [touch.clientX, touch.clientY];
    };
    // Ending a touch marks the drag as finished.
    const end = () => {
      touchStart.current = null;
    };
    // Begin listening on the canvas.
    element.addEventListener("touchstart", start);
    element.addEventListener("touchmove", move);
    element.addEventListener("touchend", end);
    // Remove canvas listeners if the mode changes or the module unmounts.
    return () => {
      element.removeEventListener("touchstart", start);
      element.removeEventListener("touchmove", move);
      element.removeEventListener("touchend", end);
    };
  }, [active, camera, gl, touchDevice]);

  // Run this movement calculation before every rendered animation frame.
  useFrame((_, delta) => {
    // Keep the camera still until the visitor crosses the threshold.
    if (!active) return;
    // Opposing forward/back inputs cancel each other to produce -1, 0, or 1.
    const forward =
      Number(keys.current.has("KeyW") || keys.current.has("ArrowUp")) -
      Number(keys.current.has("KeyS") || keys.current.has("ArrowDown"));
    // Do the same for right/left movement.
    const sideways =
      Number(keys.current.has("KeyD") || keys.current.has("ArrowRight")) -
      Number(keys.current.has("KeyA") || keys.current.has("ArrowLeft"));
    // Ask the camera for the direction it currently faces.
    const direction = forwardDirection.current;
    camera.getWorldDirection(direction);
    // Remove vertical tilt so looking upward does not make the visitor fly.
    direction.y = 0;
    // Normalize the vector so its length does not affect walking speed.
    direction.normalize();
    // A cross product creates a vector pointing right relative to the camera.
    const right = rightDirection.current
      .crossVectors(direction, camera.up)
      .normalize();
    // Move forward/backward at a frame-rate-independent speed.
    camera.position.addScaledVector(direction, forward * delta * 2.2);
    // Apply left/right movement using the right-facing vector.
    camera.position.addScaledVector(right, sideways * delta * 2.2);
    // Keep the visitor inside the modeled garden area.
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -8, 8);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -10, 8);
    // Add a tiny vertical bob so walking feels less like a floating camera.
    camera.position.y =
      1.62 +
      Math.sin(performance.now() * 0.004) *
        (forward || sideways ? 0.018 : 0.006);
  });

  // Use pointer lock on desktop; touch rotation is already handled above.
  return active && !touchDevice ? (
    // Scope pointer-lock activation to the canvas instead of every document click.
    <PointerLockControls selector="#garden-canvas" />
  ) : null;
}
