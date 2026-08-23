// Testing Library renders the public inspection card and finds semantic content.
import { render, screen } from "@testing-library/react";
// User Event clicks the same return control a garden visitor uses.
import userEvent from "@testing-library/user-event";
// Vitest supplies spies, assertions, and the test function.
import { expect, test, vi } from "vitest";
// This dialog is the HTML result of successfully inspecting a tree.
import { GardenInspectionDialog } from "./GardenInspectionDialog";

// Protect the complete tree-inspection card through its public React interface.
test("an inspected tree reveals its name, species, and story", async () => {
  // Create one event driver for the return-to-garden action.
  const user = userEvent.setup();
  // Observe closing without reaching into the dialog's internal state.
  const onClose = vi.fn();
  // Render a representative tree through the same item interface used by the scene.
  render(
    <GardenInspectionDialog
      item={{
        kind: "tree",
        id: "threshold-oak",
        name: "Threshold oak",
        latinName: "Quercus robur",
        note: "Its branches hold the morning just inside the garden gate.",
      }}
      onClose={onClose}
    />,
  );
  // The tree name becomes the dialog's accessible heading.
  expect(screen.getByRole("heading", { name: "Threshold oak" })).toBeVisible();
  // Botanical identity and story are both visible rather than hidden metadata.
  expect(screen.getByText("Quercus robur")).toBeVisible();
  expect(screen.getByText(/branches hold the morning/i)).toBeVisible();
  // Returning through the public control reports the close action to its parent.
  await user.click(
    screen.getByRole("button", { name: /return to the garden/i }),
  );
  expect(onClose).toHaveBeenCalledOnce();
});
