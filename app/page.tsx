// The route delegates the complete visit to one deep garden-experience module.
import { GardenExperience } from "@/components/garden/experience/GardenExperience";

// Next.js renders this small route adapter for the application's home page.
export default function Home() {
  // The experience hides browser state, 3D setup, audio, and overlay composition.
  return <GardenExperience />;
}
