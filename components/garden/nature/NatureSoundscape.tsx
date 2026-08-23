// React callbacks, refs, and effects manage the browser audio graph's lifetime.
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

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

// The page needs one narrow command that can run inside the threshold click gesture.
export type NatureSoundscapeHandle = {
  // Start unlocks Web Audio without exposing graph implementation details.
  start: () => void;
};

// The soundscape appears after entry but starts only from an explicit user gesture.
export const NatureSoundscape = forwardRef<
  NatureSoundscapeHandle,
  { active: boolean }
>(function NatureSoundscape({ active }, ref) {
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
    // Clear ownership first so pending callbacks cannot use a closing graph.
    graphRef.current = null;
    // Cancel the single chirp that has not fired yet.
    if (graph.nextChirp !== null) window.clearTimeout(graph.nextChirp);
    try {
      // Stop the looping rustle source immediately when its browser allows it.
      graph.rustle.stop();
    } catch {
      // A source already stopped by the browser needs no additional recovery.
    }
    try {
      // Closing the context releases browser audio resources.
      void Promise.resolve(graph.context.close()).catch(() => undefined);
    } catch {
      // Older implementations may throw while closing an incomplete context.
    }
    // Reflect the stopped state even when browser cleanup methods fail.
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
    // Track partially created resources so synchronous browser failures can unwind.
    let context: AudioContext | null = null;
    let rustle: AudioBufferSourceNode | null = null;
    try {
      // Creating the context here satisfies strict user-gesture autoplay policies.
      const activeContext = new AudioContextClass();
      // Keep a nullable outer reference solely for partial-failure cleanup.
      context = activeContext;
      // Keep the environment gentle but clearly audible on small speakers.
      const master = activeContext.createGain();
      master.gain.value = 0.12;
      master.connect(activeContext.destination);

      // Fill a short buffer with random values to approximate leaves in a breeze.
      const noiseBuffer = activeContext.createBuffer(
        1,
        activeContext.sampleRate * 2,
        activeContext.sampleRate,
      );
      const noiseData = noiseBuffer.getChannelData(0);
      for (let index = 0; index < noiseData.length; index += 1) {
        noiseData[index] = Math.random() * 2 - 1;
      }
      // Loop the random buffer continuously.
      rustle = activeContext.createBufferSource();
      rustle.buffer = noiseBuffer;
      rustle.loop = true;
      // Remove harsh high frequencies from the raw noise.
      const rustleFilter = activeContext.createBiquadFilter();
      rustleFilter.type = "lowpass";
      rustleFilter.frequency.value = 900;
      // Keep the rustle behind the bird calls without making it disappear.
      const rustleGain = activeContext.createGain();
      rustleGain.gain.value = 0.16;
      rustle.connect(rustleFilter).connect(rustleGain).connect(master);
      rustle.start();

      // Store the graph before recursive chirp scheduling begins.
      const graph: SoundscapeGraph = {
        context: activeContext,
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
        const now = activeContext.currentTime;
        // Place each phrase at a different horizontal position.
        const pan = activeContext.createStereoPanner();
        pan.pan.value = Math.random() * 1.6 - 0.8;
        pan.connect(master);
        // A three-note phrase sounds more organic than one electronic beep.
        [0, 0.09, 0.21].forEach((delay, index) => {
          // A triangle wave adds gentle harmonics while remaining soft.
          const oscillator = activeContext.createOscillator();
          oscillator.type = "triangle";
          // Change pitch and contour across each phrase.
          const baseFrequency = 1800 + Math.random() * 650 + index * 180;
          oscillator.frequency.setValueAtTime(baseFrequency, now + delay);
          oscillator.frequency.exponentialRampToValueAtTime(
            baseFrequency * (index === 1 ? 0.82 : 1.3),
            now + delay + 0.065,
          );
          // Shape the note with a quick attack and soft decay.
          const envelope = activeContext.createGain();
          envelope.gain.setValueAtTime(0.0001, now + delay);
          envelope.gain.exponentialRampToValueAtTime(0.28, now + delay + 0.018);
          envelope.gain.exponentialRampToValueAtTime(
            0.0001,
            now + delay + 0.13,
          );
          oscillator.connect(envelope).connect(pan);
          oscillator.start(now + delay);
          oscillator.stop(now + delay + 0.15);
        });
        // Retain only the single timeout that is still waiting to fire.
        graph.nextChirp = window.setTimeout(chirp, 2400 + Math.random() * 4800);
      };
      // An immediate bird phrase confirms that the garden heard the entry gesture.
      chirp();
      // Resume immediately while the browser still recognizes this click gesture.
      void Promise.resolve(activeContext.resume())
        .then(() => {
          // Reflect playback only if this graph still owns the soundscape.
          if (graphRef.current === graph) setPlaying(true);
        })
        .catch(() => {
          // A rejected autoplay unlock must not leave a false playing indicator.
          if (graphRef.current === graph) stopSoundscape();
        });
    } catch {
      // A fully registered graph can use the normal comprehensive cleanup path.
      if (graphRef.current?.context === context) {
        stopSoundscape();
        return;
      }
      try {
        // Stop a source created before the graph was ready, when one exists.
        rustle?.stop();
      } catch {
        // A partially initialized source may reject stop without leaking playback.
      }
      try {
        // Release a context created before the graph could take ownership.
        if (context)
          void Promise.resolve(context.close()).catch(() => undefined);
      } catch {
        // Older implementations may also throw while closing partial setup.
      }
      // Keep the control truthful after any synchronous setup failure.
      setPlaying(false);
    }
  }, [stopSoundscape]);

  // Expose start to the page without exposing mutable audio nodes or React state.
  useImperativeHandle(
    ref,
    () => ({
      // Forward the threshold command to the same tested button behavior.
      start: startSoundscape,
    }),
    [startSoundscape],
  );

  // Stop sound whenever the visitor leaves the active garden state.
  useEffect(() => {
    // Entry currently only moves forward, but this keeps the interface reusable.
    if (!active) stopSoundscape();
  }, [active, stopSoundscape]);

  // Keep unmount cleanup separate so entering does not stop newly unlocked audio.
  useEffect(() => {
    // Component removal must release every playing audio resource.
    return () => stopSoundscape();
  }, [stopSoundscape]);

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
});
