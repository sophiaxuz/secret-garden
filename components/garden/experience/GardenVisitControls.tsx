// These values are the complete interface required by the post-entry controls.
type GardenVisitControlsProps = {
  // Entry controls whether movement and planting buttons may be used.
  entered: boolean;
  // Status describes the latest photograph-to-flower activity.
  status: string;
  // Memory count combines original flowers with this visit's additions.
  memoryCount: number;
  // This command opens the hidden photograph input owned by the experience.
  onPlant: () => void;
};

// Convert a held mobile button into the keyboard events used by navigation.
function walkForward(pressed: boolean) {
  // Send a W keydown while held and keyup when released.
  window.dispatchEvent(
    new KeyboardEvent(pressed ? "keydown" : "keyup", { code: "KeyW" }),
  );
}

// Render guidance, mobile movement, planting feedback, and the memory tally.
export function GardenVisitControls({
  entered,
  status,
  memoryCount,
  onPlant,
}: GardenVisitControlsProps) {
  // A fragment keeps all HUD elements as direct children of the world surface.
  return (
    <>
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
            drag to look · hold the path button to walk · tap garden life to
            inspect
          </span>
        </span>
      </div>

      {/* The dot marks the center of the first-person interaction view. */}
      <div className="reticle" aria-hidden="true">
        ·
      </div>

      {/* Holding this mobile-only button dispatches forward movement. */}
      <button
        className="walk-control"
        aria-label="Walk forward"
        // Keep the hidden movement control out of keyboard navigation before entry.
        disabled={!entered}
        onPointerDown={() => walkForward(true)}
        onPointerUp={() => walkForward(false)}
        onPointerCancel={() => walkForward(false)}
      >
        ↑<small>walk</small>
      </button>

      {/* This circular control asks the experience to open its photograph picker. */}
      <button className="plant-orb" disabled={!entered} onClick={onPlant}>
        <b>＋</b>
        <small>
          plant
          <br />a memory
        </small>
      </button>
      {/* Do not create an empty toast before there is a status message. */}
      {status && <div className="garden-toast">{status}</div>}
      {/* Present the already-computed tally without knowing how it was produced. */}
      <div className="memory-tally">
        {/* Padding keeps a leading zero while the tally has one digit. */}
        {String(memoryCount).padStart(2, "0")} <small>living memories</small>
      </div>
    </>
  );
}
