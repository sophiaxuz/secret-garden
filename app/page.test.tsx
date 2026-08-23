// Testing Library renders the real page and finds controls by their accessible names.
import { render, screen } from "@testing-library/react";
// User Event reproduces a visitor's click more faithfully than calling a handler directly.
import userEvent from "@testing-library/user-event";
// Vitest supplies the test and assertion functions.
import { expect, test } from "vitest";
// Home is the public page visitors use to enter and explore the garden.
import Home from "./page";

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
