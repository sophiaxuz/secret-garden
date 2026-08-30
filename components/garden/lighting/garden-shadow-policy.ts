// Only visible meshes that deliberately opt in should enter the shadow-map pass.
export function shouldGardenMeshCastShadow({
  castShadow,
  visible,
  shadowCaster,
}: {
  castShadow: boolean;
  visible: boolean;
  shadowCaster?: boolean;
}): boolean {
  // Explicit exclusions win; otherwise preserve only an authored positive choice.
  return visible && shadowCaster !== false && castShadow;
}

// One named cadence prevents the threshold and elapsed-time rollover from drifting.
export const GARDEN_SHADOW_REFRESH_INTERVAL_SECONDS = 0.1;

// Ten updates per second preserve living shadows without duplicating every camera frame.
export function shouldRefreshGardenShadow(elapsedSeconds: number): boolean {
  // One tenth of a second is imperceptible for slow foliage and animal shadow motion.
  return elapsedSeconds >= GARDEN_SHADOW_REFRESH_INTERVAL_SECONDS;
}
