// Add readable DOM assertions such as `toBeVisible` to every Vitest test.
import "@testing-library/jest-dom/vitest";
// Testing Library removes rendered pages so one test cannot leak into the next.
import { cleanup } from "@testing-library/react";
// Vitest runs this cleanup hook after every individual test.
import { afterEach } from "vitest";

// Reset the browser-like document after each test completes.
afterEach(() => cleanup());
