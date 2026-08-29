// Convert an index and salt into one repeatable irregular value from zero to one.
export function seededUnit(index: number, salt: number): number {
  // A sine hash gives every generated property an unrelated stable rhythm.
  const wave = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  // Removing the integer part leaves a positive deterministic fraction.
  return wave - Math.floor(wave);
}
