// Testing Library renders the real page and finds controls by their accessible names.
import { render, screen } from "@testing-library/react";
// User Event reproduces a visitor's click more faithfully than calling a handler directly.
import userEvent from "@testing-library/user-event";
// Vitest supplies tests, assertions, cleanup hooks, and browser-audio spies.
import { afterEach, expect, test, vi } from "vitest";
// Home is the public page visitors use to enter and explore the garden.
import Home from "./page";

// Always remove browser substitutes even when an assertion ends a test early.
afterEach(() => vi.unstubAllGlobals());

// Install the smallest Web Audio implementation needed by the real soundscape.
function installTestAudioContext({ throwWhenPanning = false } = {}) {
  // Expose lifecycle spies so tests can verify both playback and cleanup.
  const resumeAudio = vi.fn().mockResolvedValue(undefined);
  const startRustle = vi.fn();
  const stopRustle = vi.fn();
  const closeAudio = vi.fn().mockResolvedValue(undefined);
  // Web Audio connect calls return their destination so graph chains remain realistic.
  const connectToNext = <Destination,>(destination: Destination) => destination;
  // Audio parameters expose the scheduling methods used by future bird phrases.
  const createAudioParam = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  // This focused browser substitute implements only the soundscape's public needs.
  class TestAudioContext {
    // A tiny sample rate keeps the generated noise buffer inexpensive in tests.
    sampleRate = 2;
    // The initial audio clock is enough because delayed chirps do not fire here.
    currentTime = 0;
    // Every graph terminates at the context destination.
    destination = {};
    // Gain nodes provide volume parameters and chainable graph connections.
    createGain = () => ({ gain: createAudioParam(), connect: connectToNext });
    // Both breeze and surf sources read and fill small writable channels.
    createBuffer = () => ({
      getChannelData: () => new Float32Array(4),
    });
    // The shared spies observe both continuously looping natural-bed sources.
    createBufferSource = () => ({
      buffer: null,
      loop: false,
      connect: connectToNext,
      start: startRustle,
      stop: stopRustle,
    });
    // Filters expose the frequency control configured by the soundscape.
    createBiquadFilter = () => ({
      type: "lowpass",
      frequency: createAudioParam(),
      connect: connectToNext,
    });
    // Panner failure reproduces a partially supported browser after rustle starts.
    createStereoPanner = () => {
      if (throwWhenPanning) throw new Error("Stereo panning is unavailable");
      return { pan: createAudioParam(), connect: connectToNext };
    };
    // Delayed oscillators mirror the methods used when a future chirp fires.
    createOscillator = () => ({
      type: "triangle",
      frequency: createAudioParam(),
      connect: connectToNext,
      start: vi.fn(),
      stop: vi.fn(),
    });
    // Resuming is required for browsers that create contexts in a suspended state.
    resume = resumeAudio;
    // Cleanup closes the lightweight context when the soundscape stops.
    close = closeAudio;
  }
  // Install the substitute where the production component reads the browser API.
  vi.stubGlobal("AudioContext", TestAudioContext);
  // Return only the observable lifecycle operations needed by the tests.
  return { resumeAudio, startRustle, stopRustle, closeAudio };
}

// Protect the threshold as a user-facing seam rather than inspecting React state.
test("crossing the threshold activates the garden controls", async () => {
  // Create one event driver for this visitor interaction.
  const user = userEvent.setup();
  // Render the complete home page into the browser-like test document.
  render(<Home />);
  // Find the planting control by the words exposed to assistive technology.
  const plantButton = screen.getByRole("button", { name: /plant a memory/i });
  // Find the movement control through its accessible label as well.
  const walkButton = screen.getByRole("button", { name: /walk forward/i });
  // Before entry, the hidden control must not be keyboard-operable.
  expect(plantButton).toBeDisabled();
  expect(walkButton).toBeDisabled();
  // Cross the threshold through the same button a visitor clicks.
  await user.click(
    screen.getByRole("button", { name: /cross the threshold/i }),
  );
  // Entry activates the garden's controls without exposing internal state to the test.
  expect(plantButton).toBeEnabled();
  expect(walkButton).toBeEnabled();
});

// Protect the entry gesture as the browser-approved moment that begins garden audio.
test("crossing the threshold starts the natural soundscape", async () => {
  // Install working audio and retain the two observable playback operations.
  const { resumeAudio, startRustle } = installTestAudioContext();
  // Create one event driver and render the complete visitor entry flow.
  const user = userEvent.setup();
  render(<Home />);
  // The threshold click must both enter the garden and unlock its sound.
  await user.click(
    screen.getByRole("button", { name: /cross the threshold/i }),
  );
  // Both leaf rustle and coastal wash start without requiring a hidden second click.
  expect(startRustle).toHaveBeenCalledTimes(2);
  // The context must resume while the original user gesture is still active.
  expect(resumeAudio).toHaveBeenCalledOnce();
  // Successful resume should leave one truthful, keyboard-accessible mute control.
  expect(
    await screen.findByRole("button", { name: /^garden sounds$/i }),
  ).toHaveAttribute("aria-pressed", "true");
});

// Protect garden entry when a browser exposes only part of the Web Audio API.
test("an audio setup failure still enters and releases partial sound", async () => {
  // Fail during the first bird phrase, after both continuous beds have started.
  const { startRustle, stopRustle, closeAudio } = installTestAudioContext({
    throwWhenPanning: true,
  });
  // Drive the same public threshold interaction as a visitor.
  const user = userEvent.setup();
  render(<Home />);
  await user.click(
    screen.getByRole("button", { name: /cross the threshold/i }),
  );
  // The partial graph reached both playback beds before the simulated failure.
  expect(startRustle).toHaveBeenCalledTimes(2);
  // Transactional cleanup stops both sources and releases their shared context.
  expect(stopRustle).toHaveBeenCalledTimes(2);
  expect(closeAudio).toHaveBeenCalledOnce();
  // Sound capability must never gate the visitor's core garden controls.
  expect(screen.getByRole("button", { name: /plant a memory/i })).toBeEnabled();
  expect(screen.getByRole("button", { name: /walk forward/i })).toBeEnabled();
});
