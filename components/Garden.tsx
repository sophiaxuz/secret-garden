// This module renders in the browser because WebGL is not available on the server.
"use client";

// `Environment` supplies realistic image-based ambient lighting.
import { Environment } from "@react-three/drei";
// `Canvas` creates the Three.js renderer, scene, and camera for React.
import { Canvas } from "@react-three/fiber";
// This module owns keyboard, mouse, and touch navigation.
import { FirstPersonControls } from "./garden/FirstPersonControls";
// This module contains the physical ground, plants, and trees.
import { GardenWorld } from "./garden/GardenWorld";

// These are the only facts a caller needs in order to render the garden.
type GardenProps = {
  // The number of additional procedural flowers to show.
  plantedCount: number;
  // Whether the visitor has entered and may move around.
  entered: boolean;
};

// This is the public interface for the entire 3D garden module.
export default function Garden({ plantedCount, entered }: GardenProps) {
  // Create the WebGL scene and describe everything inside it.
  return (
    // Start the camera at human eye height and enable real-time shadows.
    <Canvas camera={{ position: [0, 1.62, 7], fov: 62 }} dpr={[1, 1.6]} shadows>
      {/* Set the plain color visible behind all 3D geometry. */}
      <color attach="background" args={["#829078"]} />
      {/* Fade distant objects into the background to create depth. */}
      <fog attach="fog" args={["#829078", 8, 23]} />
      {/* Light upward and downward surfaces with different colors. */}
      <hemisphereLight intensity={1.15} color="#fff2ca" groundColor="#243626" />
      {/* Model warm sunlight coming from one direction. */}
      <directionalLight
        position={[-5, 9, 4]}
        intensity={2.3}
        color="#ffe5ad"
        castShadow
      />
      {/* Add the physical contents of the garden. */}
      <GardenWorld plantedCount={plantedCount} />
      {/* Use Drei's forest lighting preset for natural reflections. */}
      <Environment preset="forest" />
      {/* Enable navigation only after the threshold has been crossed. */}
      <FirstPersonControls active={entered} />
    </Canvas>
  );
}
