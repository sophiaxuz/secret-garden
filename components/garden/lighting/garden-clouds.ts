// Clouds wrap well beyond the 58-unit fog horizon from either walkable edge.
const CLOUD_DRIFT_MIN_X = -110;
const CLOUD_DRIFT_MAX_X = 110;

// A tuple documents positions in the same x, y, z order Three.js expects.
export type CloudPosition = [number, number, number];
// A separate tuple name distinguishes spatial size from world position.
export type CloudBounds = [number, number, number];

// Each bank has a stable identity, silhouette, position, and wind speed.
export type CloudBankDescription = {
  // A stable key lets React preserve motion while the clock changes color.
  id: string;
  // The seed makes its puff arrangement deterministic between visits.
  seed: number;
  // Position places it high enough to feel overhead rather than like garden fog.
  position: CloudPosition;
  // Bounds shape each bank into a broad, shallow natural formation.
  bounds: CloudBounds;
  // Scale creates distant variation without increasing particle count.
  scale: number;
  // Drift speed is measured in world units per second.
  driftSpeed: number;
};

// Five separated banks create depth without turning the blue sky overcast.
export const CLOUD_BANKS: CloudBankDescription[] = [
  {
    id: "western-cumulus",
    seed: 2,
    position: [-30, 15, -30],
    bounds: [9, 2.2, 3.4],
    scale: 1.15,
    driftSpeed: 0.42,
  },
  {
    id: "high-meadow-cloud",
    seed: 7,
    position: [-14, 17, -36],
    bounds: [12, 1.8, 3],
    scale: 1.35,
    driftSpeed: 0.31,
  },
  {
    id: "garden-cumulus",
    seed: 13,
    position: [7, 12.5, -20],
    bounds: [8, 2.8, 3.6],
    scale: 1,
    driftSpeed: 0.48,
  },
  {
    id: "eastern-wisp",
    seed: 19,
    position: [22, 18, -34],
    bounds: [13, 1.5, 2.8],
    scale: 1.25,
    driftSpeed: 0.36,
  },
  {
    id: "near-sky-cloud",
    seed: 29,
    position: [30, 11, -12],
    bounds: [7, 2, 3],
    scale: 0.9,
    driftSpeed: 0.54,
  },
];

// Advance one cloud bank while preserving its overshoot when it wraps around.
export function advanceCloudPosition(
  currentX: number,
  windDistance: number,
): number {
  // Adding the wind distance makes positive wind carry clouds toward the east.
  const nextX = currentX + windDistance;
  // The complete travel span is used to move an escaped cloud back to the west.
  const driftSpan = CLOUD_DRIFT_MAX_X - CLOUD_DRIFT_MIN_X;
  // This modulo form works even if a future frame advances more than one span.
  return (
    ((((nextX - CLOUD_DRIFT_MIN_X) % driftSpan) + driftSpan) % driftSpan) +
    CLOUD_DRIFT_MIN_X
  );
}
