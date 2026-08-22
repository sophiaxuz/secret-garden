// This module renders in the browser because WebGL is not available on the server.
"use client";

// `Environment` supplies reflections while `Sky` creates a daylight atmosphere.
import { Environment, Sky } from "@react-three/drei";
// `Canvas` creates the Three.js renderer, scene, and camera for React.
import { Canvas } from "@react-three/fiber";
// React state connects fast 3D targeting to the slower HTML information interface.
import { useCallback, useState } from "react";
// This module casts the center-screen ray and reports flower interactions.
import { FlowerInteraction } from "./garden/flower/FlowerInteraction";
// This native dialog presents a selected flower with correct focus behavior.
import { FlowerMemoryDialog } from "./garden/flower/FlowerMemoryDialog";
// This module owns keyboard, mouse, and touch navigation.
import { FirstPersonControls } from "./garden/FirstPersonControls";
// This module contains the physical ground, plants, and trees.
import { GardenWorld } from "./garden/GardenWorld";
// The UI and 3D objects share this description of a flower memory.
import type { FlowerMemory } from "./garden/flower/flower-memory";
// This browser-audio module provides birds and moving leaves after entry.
import { NatureSoundscape } from "./garden/nature/NatureSoundscape";

// These are the only facts a caller needs in order to render the garden.
type GardenProps = {
  // The number of additional procedural flowers to show.
  plantedCount: number;
  // Whether the visitor has entered and may move around.
  entered: boolean;
};

// This is the public interface for the entire 3D garden module.
export default function Garden({ plantedCount, entered }: GardenProps) {
  // Track the flower currently beneath the center-screen reticle.
  const [targetedFlower, setTargetedFlower] = useState<FlowerMemory | null>(
    null,
  );
  // Track the flower whose full memory card is open.
  const [selectedFlower, setSelectedFlower] = useState<FlowerMemory | null>(
    null,
  );

  // Keep this callback stable so FlowerInteraction does not reattach events every render.
  const inspectFlower = useCallback((flower: FlowerMemory) => {
    // Release pointer lock so the visitor can use the HTML card and close button.
    document.exitPointerLock?.();
    // Store the chosen flower, which causes its memory card to render.
    setSelectedFlower(flower);
  }, []);

  // Create the WebGL scene and describe everything inside it.
  return (
    // A fragment lets the Canvas and its HTML overlays remain siblings.
    <>
      {/* Start the camera at human eye height and enable real-time shadows. */}
      <Canvas
        // This id gives PointerLockControls one explicit activation element.
        id="garden-canvas"
        camera={{ position: [0, 1.62, 7], fov: 62 }}
        dpr={[1, 1.6]}
        shadows
      >
        {/* Keep a blue fallback behind the procedural sky dome. */}
        <color attach="background" args={["#8fc8e8"]} />
        {/* Fade distant objects into a pale horizon to create atmospheric depth. */}
        <fog attach="fog" args={["#b9d8dc", 15, 38]} />
        {/* Model a bright blue sky with a low, warm morning sun. */}
        <Sky
          distance={450000}
          sunPosition={[-4, 3, -8]}
          inclination={0.52}
          azimuth={0.22}
          turbidity={7}
          rayleigh={2.2}
        />
        {/* Light upward and downward surfaces with different colors. */}
        <hemisphereLight
          intensity={1.15}
          color="#fff2ca"
          groundColor="#243626"
        />
        {/* Model warm sunlight coming from one direction. */}
        <directionalLight
          position={[-5, 9, 4]}
          intensity={2.3}
          color="#ffe5ad"
          castShadow
        />
        {/* Pass the target id down so the matching flower can glow. */}
        <GardenWorld
          plantedCount={plantedCount}
          targetedFlowerId={targetedFlower?.id ?? null}
        />
        {/* Use Drei's forest lighting preset for natural reflections. */}
        <Environment preset="forest" />
        {/* Enable navigation only after the threshold has been crossed. */}
        <FirstPersonControls active={entered && !selectedFlower} />
        {/* Enable flower targeting while no memory card is covering the scene. */}
        <FlowerInteraction
          active={entered && !selectedFlower}
          onTargetChange={setTargetedFlower}
          onInspect={inspectFlower}
        />
      </Canvas>

      {/* Start the natural audio after entry and expose its mute control. */}
      <NatureSoundscape active={entered} />

      {/* Tell the visitor when the reticle is close enough to inspect a flower. */}
      {targetedFlower && !selectedFlower && (
        <div className="flower-prompt">
          <strong>{targetedFlower.name}</strong>
          <span>press E or click to remember</span>
        </div>
      )}

      {/* Render the selected flower's details in a native modal dialog. */}
      {selectedFlower && (
        <FlowerMemoryDialog
          flower={selectedFlower}
          onClose={() => setSelectedFlower(null)}
        />
      )}
    </>
  );
}
