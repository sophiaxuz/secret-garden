// This module owns browser state and therefore must render on the client.
"use client";

// Dynamic loading keeps Three.js away from server-side rendering.
import dynamic from "next/dynamic";
// These React tools manage the entry, planting, and soundscape lifecycles.
import { ChangeEvent, useEffect, useRef, useState } from "react";
// The soundscape remains mounted before entry to satisfy browser autoplay rules.
import {
  NatureSoundscape,
  type NatureSoundscapeHandle,
} from "../audio/NatureSoundscape";
// Initial flower data supplies the first truthful memory count.
import { INITIAL_FLOWER_COUNT } from "../flora/garden-flowers";
// Shared layout data limits new flowers to the rendered planting plots.
import { GARDEN_LAYOUT } from "../garden-layout";
// Static overlays are isolated from stateful visit orchestration.
import { GardenAtmosphere } from "./GardenAtmosphere";
// The threshold exposes one small entry-command interface.
import { GardenThreshold } from "./GardenThreshold";
// Visit controls expose one cohesive interface for the complete garden HUD.
import { GardenVisitControls } from "./GardenVisitControls";

// Load the WebGL world only after this module reaches the browser.
const Garden = dynamic(() => import("../Garden"), { ssr: false });

// Own one complete browser visit behind a zero-prop public interface.
export function GardenExperience() {
  // This reference lets visible planting controls open the hidden file input.
  const inputRef = useRef<HTMLInputElement>(null);
  // This narrow handle starts Web Audio during the visitor's entry gesture.
  const soundscapeRef = useRef<NatureSoundscapeHandle>(null);
  // This records whether the visitor has crossed the opening threshold.
  const [entered, setEntered] = useState(false);
  // This controls how many user-created flowers exist in the scene.
  const [plantedCount, setPlantedCount] = useState(0);
  // This holds the feedback message shown after selecting a photograph.
  const [status, setStatus] = useState("");

  // Register the P-key shortcut and keep it synchronized with entry state.
  useEffect(() => {
    // This handler opens the photograph picker when an entered visitor presses P.
    const plantWithKeyboard = (event: KeyboardEvent) => {
      // Ignore both unrelated keys and planting attempts made before entry.
      if (entered && event.code === "KeyP") inputRef.current?.click();
    };
    // Begin listening for the browser-wide planting shortcut.
    window.addEventListener("keydown", plantWithKeyboard);
    // Remove the old listener whenever entry state changes or the visit ends.
    return () => window.removeEventListener("keydown", plantWithKeyboard);
  }, [entered]);

  // Enter the world and unlock its sound from the same browser-approved click.
  function enterGarden() {
    try {
      // Start audio before the event handler ends so autoplay policies accept it.
      soundscapeRef.current?.start();
    } finally {
      // Audio support must never prevent the visitor from entering the garden.
      setEntered(true);
    }
  }

  // Handle one photograph chosen through the hidden planting input.
  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    // Read the first selected file, if it exists.
    const file = event.target.files?.[0];
    // Stop when the picker was closed without selecting anything.
    if (!file) return;
    // Give immediate feedback while the demo flower is prepared.
    setStatus(`Holding ${file.name} up to the light…`);
    // Clear the input so the same photograph can be selected again.
    event.currentTarget.value = "";
    // Simulate the future identification request with a short delay.
    window.setTimeout(() => {
      // Add one procedural flower without exceeding available plot capacity.
      setPlantedCount((count) =>
        Math.min(count + 1, GARDEN_LAYOUT.plantedFlowers.capacity),
      );
      // Be explicit that this is not yet real plant identification.
      setStatus("A new demo bloom is stirring.");
    }, 850);
  }

  // Combine original and visit-created flowers for the visible tally.
  const memoryCount = INITIAL_FLOWER_COUNT + plantedCount;

  // Compose the 3D world and its HTML interface at one visit-level seam.
  return (
    <main className={`world ${entered ? "entered" : ""}`}>
      {/* This input stays hidden; the orb and P shortcut open it through its ref. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={choosePhoto}
        hidden
      />
      {/* Render the 3D garden with only the state it needs to know. */}
      <Garden plantedCount={plantedCount} entered={entered} />
      {/* Keep audio mounted so the threshold click can start it synchronously. */}
      <NatureSoundscape ref={soundscapeRef} active={entered} />
      {/* Static visual texture remains independent from visit state. */}
      <GardenAtmosphere />
      {/* The doorway receives one command and owns its own presentation. */}
      <GardenThreshold onEnter={enterGarden} />
      {/* The HUD receives prepared values and commands rather than owning state. */}
      <GardenVisitControls
        entered={entered}
        status={status}
        memoryCount={memoryCount}
        onPlant={() => inputRef.current?.click()}
      />
    </main>
  );
}
