// React memoizes the procedural glow and releases its GPU memory on teardown.
import { useEffect, useMemo } from "react";
// Three supplies the texture, colour, and additive-light blending primitives.
import * as THREE from "three";
// The Sun shares the astronomical tuple used by the directional daylight source.
import type { CelestialPosition } from "./uk-garden-time";

// A modest texture is enough because smooth filtering softens the distant corona.
export const SUN_TEXTURE_SIZE = 128;

// Calculate the transparent glow at one normalized distance from the solar centre.
export function getSunAlpha(radius: number): number {
  // The small opaque core preserves a readable circular solar disc.
  if (radius <= 0.085) return 1;
  // A bright inner rim softens the edge instead of drawing a hard flat circle.
  if (radius <= 0.14) return 1 - ((radius - 0.085) / 0.055) * 0.64;
  // An exponential falloff forms a broad, subtle atmospheric corona.
  const corona = 0.36 * Math.exp(-5.4 * (radius - 0.14));
  // Normalize edge fading so the corona begins exactly where the inner rim ends.
  const edgeFade = Math.max(0, (1 - radius) / (1 - 0.14)) ** 1.7;
  // Reaching zero at the texture boundary prevents a visible square around it.
  return corona * edgeFade;
}

// Build a white radial alpha texture that can inherit the live solar colour.
function createSunTexture(): THREE.DataTexture {
  // Four channels store red, green, blue, and transparency for every texel.
  const pixels = new Uint8Array(SUN_TEXTURE_SIZE * SUN_TEXTURE_SIZE * 4);
  // Visit every row in the square texture.
  for (let y = 0; y < SUN_TEXTURE_SIZE; y += 1) {
    // Visit every column in the current row.
    for (let x = 0; x < SUN_TEXTURE_SIZE; x += 1) {
      // Normalize the pixel centre around zero so radius is direction-independent.
      const normalizedX = (x + 0.5) / SUN_TEXTURE_SIZE - 0.5;
      const normalizedY = (y + 0.5) / SUN_TEXTURE_SIZE - 0.5;
      // Scale the centre-to-edge distance to a convenient zero-to-one radius.
      const radius = Math.hypot(normalizedX, normalizedY) * 2;
      // Four consecutive bytes belong to this pixel.
      const offset = (y * SUN_TEXTURE_SIZE + x) * 4;
      // White colour lets the sprite material supply sunrise or midday warmth.
      pixels[offset] = 255;
      pixels[offset + 1] = 255;
      pixels[offset + 2] = 255;
      // Alpha carries the opaque disc and the gradually disappearing corona.
      pixels[offset + 3] = Math.round(getSunAlpha(radius) * 255);
    }
  }
  // Construct one renderer-ready texture from the generated pixel buffer.
  const texture = new THREE.DataTexture(
    pixels,
    SUN_TEXTURE_SIZE,
    SUN_TEXTURE_SIZE,
    THREE.RGBAFormat,
  );
  // Linear filtering keeps the corona soft when viewed at different resolutions.
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  // The byte colours represent visible sRGB light rather than linear data values.
  texture.colorSpace = THREE.SRGBColorSpace;
  // Tell Three.js to upload the completed procedural texture.
  texture.needsUpdate = true;
  // Return the finished reusable solar appearance.
  return texture;
}

// Describe the changing astronomical values needed by the visible solar sprite.
type GardenSunProps = {
  // Position keeps the visible disc aligned with sunlight and the atmospheric sky.
  position: CelestialPosition;
  // Colour moves naturally from amber near the horizon to cream at midday.
  color: string;
  // Intensity lets the disc disappear smoothly beneath twilight.
  intensity: number;
};

// Render a small solar disc inside a much softer atmospheric corona.
export function GardenSun({ position, color, intensity }: GardenSunProps) {
  // Generate the radial texture once for this mounted sky.
  const texture = useMemo(createSunTexture, []);

  // Release the manually generated texture when the garden Canvas unmounts.
  useEffect(() => {
    // Disposal prevents its WebGL allocation surviving after navigation.
    return () => texture.dispose();
  }, [texture]);

  // Keep the glow visible near the horizon without overpowering bright midday sky.
  const opacity = Math.min(1, 0.68 + intensity * 0.1);

  // A sprite automatically faces the visitor, as a distant celestial disc should.
  return (
    <sprite position={position} scale={[8.5, 8.5, 1]}>
      <spriteMaterial
        map={texture}
        color={color}
        opacity={opacity}
        transparent
        depthWrite={false}
        fog={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  );
}
