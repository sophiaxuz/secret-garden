// The threshold needs only one command from its owning experience module.
type GardenThresholdProps = {
  // This callback enters the world and unlocks its browser audio.
  onEnter: () => void;
};

// Render the poetic doorway shown before a visitor enters the garden.
export function GardenThreshold({ onEnter }: GardenThresholdProps) {
  // The surrounding page class controls this section's entrance transition.
  return (
    <section className="threshold-copy">
      {/* The quiet opening line sets the emotional context. */}
      <p>Somewhere between noticing and remembering</p>
      {/* The explicit break controls the heading's visual rhythm. */}
      <h1>
        There is a garden
        <br />
        only you can enter.
      </h1>
      {/* Clicking unlocks sound and reveals the garden controls together. */}
      <button className="enter" onClick={onEnter}>
        cross the threshold <span>→</span>
      </button>
    </section>
  );
}
