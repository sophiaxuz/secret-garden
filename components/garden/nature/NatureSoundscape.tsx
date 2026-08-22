// React callbacks and effects manage the browser audio graph's lifetime.
import { useCallback, useEffect, useRef, useState } from "react";

// Keep every resource needed to stop one running soundscape together.
type SoundscapeGraph = {
  // The context owns all Web Audio nodes.
  context: AudioContext;
  // The master gain controls overall loudness.
  master: GainNode;
  // The looping source produces leaf-rustle texture.
  rustle: AudioBufferSourceNode;
  // Only one future chirp timeout is needed at a time.
  nextChirp: number | null;
};

// The soundscape appears after entry but starts only from an explicit user gesture.
export function NatureSoundscape({ active }: { active: boolean }) {
  // This state keeps button text and accessibility state truthful.
  const [playing, setPlaying] = useState(false);
  // The ref provides synchronous access to the currently running graph.
  const graphRef = useRef<SoundscapeGraph | null>(null);

  // Stop every audio resource created by the current graph.
  const stopSoundscape = useCallback(() => {
    // Read the graph once before clearing its shared ref.
    const graph = graphRef.current;
    // There is nothing to stop before the visitor starts audio.
    if (!graph) return;
    // Cancel the single chirp that has not fired yet.
    if (graph.nextChirp !== null) window.clearTimeout(graph.nextChirp);
    // Stop the looping rustle source immediately.
    graph.rustle.stop();
    // Closing the context releases browser audio resources.
    void graph.context.close();
    // Clear shared state after cleanup finishes.
    graphRef.current = null;
    setPlaying(false);
  }, []);

  // Create and start the sound graph synchronously inside a click gesture.
  const startSoundscape = useCallback(() => {
    // Do not accidentally create two overlapping gardens.
    if (graphRef.current) return;
    // Safari exposes its prefixed constructor on some older devices.
    const AudioContextClass =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    // Stop gracefully in a browser without Web Audio support.
    if (!AudioContextClass) return;
    // Creating the context here satisfies strict user-gesture autoplay policies.
    const context = new AudioContextClass();
    // Keep the whole environment quiet enough to sit behind exploration.
    const master = context.createGain();
    master.gain.value = 0.055;
    master.connect(context.destination);

    // Fill a short buffer with random values to approximate leaves in a breeze.
    const noiseBuffer = context.createBuffer(
      1,
      context.sampleRate * 2,
      context.sampleRate,
    );
    const noiseData = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noiseData.length; index += 1) {
      noiseData[index] = Math.random() * 2 - 1;
    }
    // Loop the random buffer continuously.
    const rustle = context.createBufferSource();
    rustle.buffer = noiseBuffer;
    rustle.loop = true;
    // Remove harsh high frequencies from the raw noise.
    const rustleFilter = context.createBiquadFilter();
    rustleFilter.type = "lowpass";
    rustleFilter.frequency.value = 900;
    // Keep the rustle much quieter than the bird calls.
    const rustleGain = context.createGain();
    rustleGain.gain.value = 0.075;
    rustle.connect(rustleFilter).connect(rustleGain).connect(master);
    rustle.start();

    // Store the graph before recursive chirp scheduling begins.
    const graph: SoundscapeGraph = {
      context,
      master,
      rustle,
      nextChirp: null,
    };
    graphRef.current = graph;

    // Build one short, spatial, rising-and-falling bird phrase.
    const chirp = () => {
      // Stop recursion if this graph was replaced or closed.
      if (graphRef.current !== graph) return;
      // The fired timeout is no longer pending.
      graph.nextChirp = null;
      // Schedule notes against the audio clock for smooth envelopes.
      const now = context.currentTime;
      // Place each phrase at a different horizontal position.
      const pan = context.createStereoPanner();
      pan.pan.value = Math.random() * 1.6 - 0.8;
      pan.connect(master);
      // A three-note phrase sounds more organic than one electronic beep.
      [0, 0.09, 0.21].forEach((delay, index) => {
        // A triangle wave adds gentle harmonics while remaining soft.
        const oscillator = context.createOscillator();
        oscillator.type = "triangle";
        // Change pitch and contour across each phrase.
        const baseFrequency = 1800 + Math.random() * 650 + index * 180;
        oscillator.frequency.setValueAtTime(baseFrequency, now + delay);
        oscillator.frequency.exponentialRampToValueAtTime(
          baseFrequency * (index === 1 ? 0.82 : 1.3),
          now + delay + 0.065,
        );
        // Shape the note with a quick attack and soft decay.
        const envelope = context.createGain();
        envelope.gain.setValueAtTime(0.0001, now + delay);
        envelope.gain.exponentialRampToValueAtTime(0.28, now + delay + 0.018);
        envelope.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.13);
        oscillator.connect(envelope).connect(pan);
        oscillator.start(now + delay);
        oscillator.stop(now + delay + 0.15);
      });
      // Retain only the single timeout that is still waiting to fire.
      graph.nextChirp = window.setTimeout(chirp, 2400 + Math.random() * 4800);
    };
    // Leave a short breath between clicking and the first bird phrase.
    graph.nextChirp = window.setTimeout(chirp, 500);
    // Resume immediately while the browser still recognizes this click gesture.
    void context.resume();
    // Reflect the audible state in the interface.
    setPlaying(true);
  }, []);

  // Stop sound when leaving the garden or unmounting this module.
  useEffect(() => {
    // Entry currently only moves forward, but this keeps the interface reusable.
    if (!active) stopSoundscape();
    // Component removal must release any playing audio.
    return () => stopSoundscape();
  }, [active, stopSoundscape]);

  // Do not show an audio control before the visitor enters the garden.
  if (!active) return null;

  // The visitor's click either starts or stops the soundscape.
  return (
    <button
      className="sound-control"
      aria-pressed={playing}
      onClick={playing ? stopSoundscape : startSoundscape}
    >
      {/* The filled circle communicates that sound is currently active. */}
      <span aria-hidden="true">{playing ? "◉" : "○"}</span>
      {playing ? "garden sounds" : "start garden sounds"}
    </button>
  );
}
