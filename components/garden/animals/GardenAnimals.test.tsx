// Testing Library observes the public scene-composition props through light mocks.
import { render, screen } from "@testing-library/react";
// Vitest supplies module substitutes and readable assertions.
import { afterEach, expect, test, vi } from "vitest";
// The real composition boundary decides activity for the complete animal cast.
import { GardenAnimals } from "./GardenAnimals";

// Each model mock exposes only the species and sleeping state passed by the scene.
function MockAnimal({
  species,
  sleeping,
}: {
  // Species keeps multiple butterflies distinguishable in one flat DOM test.
  species: string;
  // Sleeping is the public behaviour signal under test.
  sleeping?: boolean;
}) {
  // Data attributes make the scene contract observable without inspecting WebGL.
  return <div data-testid={species} data-sleeping={String(sleeping)} />;
}

// Replace renderer-heavy species with tiny observers at the GardenAnimals seam.
vi.mock("./butterfly/Butterfly", () => ({
  Butterfly: ({
    sleeping,
    item,
  }: {
    sleeping?: boolean;
    item: { id: string };
  }) => <MockAnimal species={item.id} sleeping={sleeping} />,
}));
vi.mock("./robin/Robin", () => ({
  Robin: ({ sleeping }: { sleeping?: boolean }) => (
    <MockAnimal species="robin" sleeping={sleeping} />
  ),
}));
vi.mock("./squirrel/Squirrel", () => ({
  Squirrel: ({ sleeping }: { sleeping?: boolean }) => (
    <MockAnimal species="squirrel" sleeping={sleeping} />
  ),
}));
vi.mock("./rabbit/Rabbit", () => ({
  Rabbit: ({ sleeping }: { sleeping?: boolean }) => (
    <MockAnimal species="rabbit" sleeping={sleeping} />
  ),
}));
vi.mock("./dog/Dog", () => ({
  Dog: ({ sleeping }: { sleeping?: boolean }) => (
    <MockAnimal species="dog" sleeping={sleeping} />
  ),
}));
vi.mock("./cat/Cat", () => ({
  Cat: ({ sleeping }: { sleeping?: boolean }) => (
    <MockAnimal species="cat" sleeping={sleeping} />
  ),
}));

// Remove the browser preference substitute after this focused component test.
afterEach(() => vi.unstubAllGlobals());

// Every rendered inhabitant must receive the same nocturnal rest signal.
test("the complete animal cast sleeps during the UK night phase", () => {
  // JSDOM needs the small preference API used by the real composition boundary.
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  // Render the real animal composition with astronomical night as its input.
  render(<GardenAnimals targetedItemId={null} lightPhase="night" />);
  // Three butterflies plus five larger animals make the full eight-member cast.
  const inhabitants = screen.getAllByTestId(/./);
  // No species may continue its ordinary roaming after night begins.
  expect(inhabitants).toHaveLength(8);
  for (const inhabitant of inhabitants) {
    // Every mocked species exposes the actual sleeping prop it received.
    expect(inhabitant).toHaveAttribute("data-sleeping", "true");
  }
});
