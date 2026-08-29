// This module renders in the browser because WebGL is not available on the server.
"use client";

// `Environment` supplies reflections that adapt to the garden's current light.
import { Environment } from "@react-three/drei";
// `Canvas` creates the Three.js renderer, scene, and camera for React.
import { Canvas } from "@react-three/fiber";
// React state connects fast 3D targeting to the slower HTML information interface.
import { useCallback, useState } from "react";
// This module owns keyboard, mouse, and touch navigation.
import { FirstPersonControls } from "./navigation/FirstPersonControls";
// This module composes the terrain, flora, and animals in the physical world.
import { GardenWorld } from "./GardenWorld";
// Shared dimensions place the camera consistently with the larger garden.
import { GARDEN_LAYOUT } from "./garden-layout";
// This module casts the center-screen ray and reports garden-life interactions.
import { GardenInteraction } from "./interaction/GardenInteraction";
// This native dialog presents selected garden life with correct focus behavior.
import { GardenInspectionDialog } from "./interaction/GardenInspectionDialog";
// This provider limits raycasting to registered garden-life hit volumes.
import { GardenInteractionRegistryProvider } from "./interaction/GardenInteractionRegistry";
// This HTML clock displays the same UK time that controls the celestial lights.
import { GardenClock } from "./lighting/GardenClock";
// This module owns the sky, visible Sun and Moon, and directional shadows.
import { GardenLighting } from "./lighting/GardenLighting";
// This hook updates a London-based astronomical snapshot once per second.
import { useUkGardenTime } from "./lighting/use-uk-garden-time";
// This hook keeps one resilient live London weather snapshot for the scene and HUD.
import { useGardenWeather } from "./weather/use-garden-weather";
// The UI and 3D objects share one inspectable garden identity.
import {
  GARDEN_ITEM_LANGUAGE,
  type GardenItem,
} from "./interaction/garden-item";

// These are the only facts a caller needs in order to render the garden.
type GardenProps = {
  // The number of additional procedural flowers to show.
  plantedCount: number;
  // Whether the visitor has entered and may move around.
  entered: boolean;
};

// This is the public interface for the entire 3D garden module.
export default function Garden({ plantedCount, entered }: GardenProps) {
  // Track the flower, tree, or animal beneath the center-screen reticle.
  const [targetedItem, setTargetedItem] = useState<GardenItem | null>(null);
  // Track the garden item whose full inspection card is open.
  const [selectedItem, setSelectedItem] = useState<GardenItem | null>(null);
  // Share one live UK snapshot between the WebGL sky and the HTML clock.
  const gardenTime = useUkGardenTime();
  // Share one weather snapshot between clouds, rain, sunlight, and its visible label.
  const gardenWeather = useGardenWeather();

  // Keep this callback stable so GardenInteraction does not reattach its listeners.
  const inspectItem = useCallback((item: GardenItem) => {
    // Release pointer lock so the visitor can use the HTML card and close button.
    document.exitPointerLock?.();
    // Store the chosen life, which causes its inspection card to render.
    setSelectedItem(item);
  }, []);

  // Create the WebGL scene and describe everything inside it.
  return (
    // A fragment lets the Canvas and its HTML overlays remain siblings.
    <>
      {/* Start the camera at human eye height and enable real-time shadows. */}
      <Canvas
        // This id gives PointerLockControls one explicit activation element.
        id="garden-canvas"
        camera={{
          position: [
            GARDEN_LAYOUT.entrance.x,
            GARDEN_LAYOUT.entrance.y,
            GARDEN_LAYOUT.entrance.z,
          ],
          fov: 62,
        }}
        dpr={[1, 1.6]}
        shadows="soft"
      >
        {/* Make atmosphere and shadow direction follow the live UK sky. */}
        <GardenLighting time={gardenTime} weather={gardenWeather} />
        {/* Share one narrow interaction registry between life and raycaster. */}
        <GardenInteractionRegistryProvider>
          {/* Pass the target id down so the matching garden life can glow. */}
          <GardenWorld
            plantedCount={plantedCount}
            targetedItemId={targetedItem?.id ?? null}
          />
          {/* Enable targeting while no inspection card is covering the scene. */}
          <GardenInteraction
            active={entered && !selectedItem}
            onTargetChange={setTargetedItem}
            onInspect={inspectItem}
          />
        </GardenInteractionRegistryProvider>
        {/* Use Drei's forest lighting preset for natural reflections. */}
        <Environment
          preset="forest"
          environmentIntensity={gardenTime.environmentIntensity}
        />
        {/* Enable navigation only after the threshold has been crossed. */}
        <FirstPersonControls active={entered && !selectedItem} />
      </Canvas>

      {/* Keep civil time visible without placing HTML inside the WebGL canvas. */}
      <GardenClock time={gardenTime} weather={gardenWeather} />

      {/* Tell the visitor when the reticle is close enough to inspect garden life. */}
      {targetedItem && !selectedItem && (
        <div className="garden-prompt">
          <strong>{targetedItem.name}</strong>
          <span>{GARDEN_ITEM_LANGUAGE[targetedItem.kind].prompt}</span>
        </div>
      )}

      {/* Render the selected garden life in a native modal dialog. */}
      {selectedItem && (
        <GardenInspectionDialog
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}
