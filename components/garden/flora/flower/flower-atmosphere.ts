// Flowers consume only the two wind fields needed for responsive movement.
export type FlowerAtmosphere = {
  windSpeedKph: number;
  windDirectionDegrees: number;
};

// Meteorological bearings name where wind comes from, while plants bend where it goes.
export function getFlowerWindTravelRadians(
  windDirectionDegrees: number,
): number {
  // Add half a turn to convert source bearing into horizontal travel direction.
  return ((windDirectionDegrees + 180) * Math.PI) / 180;
}
