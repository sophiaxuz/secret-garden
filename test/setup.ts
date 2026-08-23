// Add readable DOM assertions such as `toBeVisible` to every Vitest test.
import "@testing-library/jest-dom/vitest";
// Testing Library removes rendered pages so one test cannot leak into the next.
import { cleanup } from "@testing-library/react";
// Vitest runs this cleanup hook after every individual test.
import { afterEach } from "vitest";

// JSDOM omits the native method that opens a dialog and exposes its contents.
HTMLDialogElement.prototype.showModal = function showModal() {
  // Match the open attribute that a real browser adds for accessibility.
  this.setAttribute("open", "");
};

// JSDOM also omits the native method used by the dialog's effect cleanup.
HTMLDialogElement.prototype.close = function close() {
  // Match the attribute removal performed by a real browser when closing.
  this.removeAttribute("open");
};

// Reset the browser-like document after each test completes.
afterEach(() => cleanup());
