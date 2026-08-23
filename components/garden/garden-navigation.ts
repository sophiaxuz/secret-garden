// Shared garden dimensions are the single source of truth for walkable limits.
import { GARDEN_LAYOUT } from "./garden-layout";

// Navigation needs only horizontal coordinates, not a complete Three.js vector.
type GardenPosition = {
  // X describes movement from the garden's western edge to its eastern edge.
  x: number;
  // Z describes movement between the entrance and the garden's deeper edge.
  z: number;
};

// Move an existing position to the nearest valid point after it crosses an edge.
export function keepVisitorInsideGarden(position: GardenPosition): void {
  // Mutating the live position avoids allocating a throwaway object every video frame.
  position.x = Math.min(
    GARDEN_LAYOUT.bounds.maxX,
    Math.max(GARDEN_LAYOUT.bounds.minX, position.x),
  );
  position.z = Math.min(
    GARDEN_LAYOUT.bounds.maxZ,
    Math.max(GARDEN_LAYOUT.bounds.minZ, position.z),
  );
}
