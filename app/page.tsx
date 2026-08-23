// This directive lets the component use browser-only React features.
"use client";

// `dynamic` can load a component only when the code reaches the browser.
import dynamic from "next/dynamic";
// These React tools provide event types, side effects, references, and state.
import { ChangeEvent, useEffect, useRef, useState } from "react";
// The initial tally is derived from the same flower data rendered in the scene.
import { INITIAL_FLOWER_COUNT } from "@/components/garden/garden-flowers";
// The page uses the same planting capacity as the rendered garden plots.
import { GARDEN_LAYOUT } from "@/components/garden/garden-layout";

// Three.js needs browser APIs, so server-side rendering is disabled here.
const Garden = dynamic(() => import("@/components/Garden"), { ssr: false });

// `Home` is the component Next.js renders for the `/` route.
export default function Home() {
  // This reference lets custom controls open the hidden file input.
  const inputRef = useRef<HTMLInputElement>(null);
  // This records whether the visitor has crossed the opening threshold.
  const [entered, setEntered] = useState(false);
  // This controls how many user-created flowers exist in the scene.
  const [plantedCount, setPlantedCount] = useState(0);
  // This holds the feedback message shown after selecting a photograph.
  const [status, setStatus] = useState("");

  // Register the P-key shortcut and keep it synchronized with `entered`.
  useEffect(() => {
    // This handler opens the photograph picker when P is pressed.
    const plantWithKeyboard = (event: KeyboardEvent) => {
      // The shortcut works only after the visitor enters the garden.
      if (entered && event.code === "KeyP") inputRef.current?.click();
    };
    // Begin listening for keyboard input.
    window.addEventListener("keydown", plantWithKeyboard);
    // Clean up the listener when the effect reruns or the page unmounts.
    return () => window.removeEventListener("keydown", plantWithKeyboard);
  }, [entered]);

  // Mobile buttons call this helper to imitate keyboard movement.
  function walk(code: "KeyW" | "KeyS", pressed: boolean) {
    // Send `keydown` while held and `keyup` when released.
    window.dispatchEvent(
      new KeyboardEvent(pressed ? "keydown" : "keyup", { code }),
    );
  }

  // This handler runs after the visitor chooses a photograph.
  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    // Read the first selected file, if it exists.
    const file = event.target.files?.[0];
    // Stop when the picker was closed without selecting anything.
    if (!file) return;
    // Give immediate feedback while the demo flower is prepared.
    setStatus(`Holding ${file.name} up to the light…`);
    // Clear the input so the same photograph can be selected again.
    event.currentTarget.value = "";
    // Simulate a future identification request with a short delay.
    window.setTimeout(() => {
      // Add one procedural flower to the scene.
      setPlantedCount((count) =>
        Math.min(count + 1, GARDEN_LAYOUT.plantedFlowers.capacity),
      );
      // Be explicit that this is not yet a real plant identification.
      setStatus("A new demo bloom is stirring.");
    }, 850);
  }

  // Return the 3D world and its HTML interface overlays.
  return (
    // The `entered` class activates the post-entry styles and controls.
    <main className={`world ${entered ? "entered" : ""}`}>
      {/* This input stays hidden; other controls open it through its ref. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={choosePhoto}
        hidden
      />
      {/* Render the browser-only 3D module with the current page state. */}
      <Garden plantedCount={plantedCount} entered={entered} />
      {/* These layers add edge shading and analogue-looking texture. */}
      <div className="vignette" />
      <div className="grain" />

      {/* This label establishes the garden's place, season, and time. */}
      <div className="garden-name">
        The Secret Garden <i>·</i> Spring, first light
      </div>
      {/* This doorway is visible before the visitor enters. */}
      <section className="threshold-copy">
        {/* The quiet opening line sets the emotional context. */}
        <p>Somewhere between noticing and remembering</p>
        {/* The explicit break controls the heading's visual rhythm. */}
        <h1>
          There is a garden
          <br />
          only you can enter.
        </h1>
        {/* Clicking changes state, which reveals the garden controls. */}
        <button className="enter" onClick={() => setEntered(true)}>
          cross the threshold <span>→</span>
        </button>
      </section>

      {/* This guidance fades in after entry. */}
      <div className="inside-copy">
        <p>
          Move slowly.
          <br />
          The garden is listening.
        </p>
        {/* CSS shows the instruction appropriate for the input device. */}
        <span>
          <span className="desktop-help">
            click to look · WASD to wander · E to inspect · P to plant · Esc
            releases
          </span>
          <span className="touch-help">
            drag to look · hold the path button to walk · tap a flower to
            inspect
          </span>
        </span>
      </div>

      {/* The dot marks the center of the first-person view on desktop. */}
      <div className="reticle" aria-hidden="true">
        ·
      </div>
      {/* Holding this mobile-only button dispatches forward movement. */}
      <button
        className="walk-control"
        aria-label="Walk forward"
        // Keep the hidden movement control out of keyboard navigation before entry.
        disabled={!entered}
        onPointerDown={() => walk("KeyW", true)}
        onPointerUp={() => walk("KeyW", false)}
        onPointerCancel={() => walk("KeyW", false)}
      >
        ↑<small>walk</small>
      </button>

      {/* This circular control opens the photograph picker. */}
      <button
        className="plant-orb"
        // A disabled control cannot be reached by keyboard before garden entry.
        disabled={!entered}
        onClick={() => inputRef.current?.click()}
      >
        <b>＋</b>
        <small>
          plant
          <br />a memory
        </small>
      </button>
      {/* Do not create an empty toast before there is a status message. */}
      {status && <div className="garden-toast">{status}</div>}
      {/* Combine the initial flowers with those planted this visit. */}
      <div className="memory-tally">
        {/* Padding keeps a leading zero while the tally has one digit. */}
        {String(INITIAL_FLOWER_COUNT + plantedCount).padStart(2, "0")}{" "}
        <small>living memories</small>
      </div>
    </main>
  );
}
