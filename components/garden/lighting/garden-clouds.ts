// Clouds wrap well beyond the 58-unit fog horizon from either walkable edge.
const CLOUD_DRIFT_MIN_X = -110;
const CLOUD_DRIFT_MAX_X = 110;

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
