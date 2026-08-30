// Three supplies shader compilation types and restrained numeric interpolation.
import * as THREE from "three";
// The material receives only the renderer-independent ground atmosphere snapshot.
import type { GroundAtmosphere } from "./ground-atmosphere";

// This interface retains the compiled fields updated after the first render.
export type CompiledGroundShader = {
  // Uniform values carry time, season, and weather into the existing GPU program.
  uniforms: Record<string, THREE.IUniform>;
};

// Extend a standard lit material with landscape-scale botanical variation.
export function compileGroundShader(
  compiled: THREE.WebGLProgramParametersWithUniforms,
  atmosphere: GroundAtmosphere,
): CompiledGroundShader {
  // Wetness controls selective pigment saturation and softened roughness.
  compiled.uniforms.uGroundWetness = { value: atmosphere.wetness };
  // This multiplier darkens the complete albedo response only within natural limits.
  compiled.uniforms.uGroundColorMultiplier = {
    value: atmosphere.colorMultiplier,
  };
  // Seasonal warmth introduces faint straw and loam shifts between green patches.
  compiled.uniforms.uGroundSeasonalWarmth = {
    value: atmosphere.seasonalWarmth,
  };
  // Night coolness preserves readable moonlit colour instead of crushing to black.
  compiled.uniforms.uGroundNightCoolness = {
    value: atmosphere.nightCoolness,
  };
  // World position lets broad patches ignore the repeating texture coordinates.
  compiled.vertexShader = compiled.vertexShader.replace(
    "#include <common>",
    `#include <common>
varying vec3 vGroundWorldPosition;`,
  );
  // Preserve standard geometry while sharing its final world location with fragments.
  compiled.vertexShader = compiled.vertexShader.replace(
    "#include <begin_vertex>",
    `vec3 transformed = vec3(position);
vGroundWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
  );
  // Add compact value noise helpers beside Three's standard fragment utilities.
  compiled.fragmentShader = compiled.fragmentShader.replace(
    "#include <common>",
    `#include <common>
uniform float uGroundWetness;
uniform float uGroundColorMultiplier;
uniform float uGroundSeasonalWarmth;
uniform float uGroundNightCoolness;
varying vec3 vGroundWorldPosition;

float gardenGroundHash(vec2 point) {
  return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
}

vec2 gardenGroundHash2(vec2 point) {
  vec2 projected = vec2(
    dot(point, vec2(127.1, 311.7)),
    dot(point, vec2(269.5, 183.3))
  );
  return fract(sin(projected) * 43758.5453123);
}

float gardenGroundNoise(vec2 point) {
  vec2 cell = floor(point);
  vec2 local = fract(point);
  vec2 eased = local * local * (3.0 - 2.0 * local);
  float lower = mix(
    gardenGroundHash(cell),
    gardenGroundHash(cell + vec2(1.0, 0.0)),
    eased.x
  );
  float upper = mix(
    gardenGroundHash(cell + vec2(0.0, 1.0)),
    gardenGroundHash(cell + vec2(1.0, 1.0)),
    eased.x
  );
  return mix(lower, upper, eased.y);
}

float gardenGroundFbm(vec2 point) {
  float value = gardenGroundNoise(point) * 0.58;
  value += gardenGroundNoise(point * 2.03 + vec2(3.7, -1.9)) * 0.28;
  value += gardenGroundNoise(point * 4.11 + vec2(-2.4, 5.2)) * 0.14;
  return value;
}

vec4 gardenStochasticTexture(sampler2D sourceTexture, vec2 uv) {
  vec2 shiftedUv = uv + 0.5;
  vec2 cell = floor(shiftedUv);
  vec2 local = fract(shiftedUv);
  vec2 blend = smoothstep(vec2(0.78), vec2(1.0), local);
  vec4 lowerLeft = texture2D(
    sourceTexture,
    uv + gardenGroundHash2(cell)
  );
  vec4 lowerRight = texture2D(
    sourceTexture,
    uv + gardenGroundHash2(cell + vec2(1.0, 0.0))
  );
  vec4 upperLeft = texture2D(
    sourceTexture,
    uv + gardenGroundHash2(cell + vec2(0.0, 1.0))
  );
  vec4 upperRight = texture2D(
    sourceTexture,
    uv + gardenGroundHash2(cell + vec2(1.0, 1.0))
  );
  return mix(
    mix(lowerLeft, lowerRight, blend.x),
    mix(upperLeft, upperRight, blend.x),
    blend.y
  );
}`,
  );
  // Replace direct tiling with four continuously blended, randomly offset samples.
  compiled.fragmentShader = compiled.fragmentShader.replace(
    "#include <map_fragment>",
    `#ifdef USE_MAP
vec4 sampledDiffuseColor = gardenStochasticTexture(map, vMapUv);
diffuseColor *= sampledDiffuseColor;
#endif

vec2 gardenGroundPoint = vGroundWorldPosition.xz;
float gardenBroadPatch = gardenGroundFbm(gardenGroundPoint * 0.075);
float gardenMidPatch = gardenGroundFbm(
  gardenGroundPoint * 0.23 + vec2(4.2, -2.7)
);
float gardenSoilPocket = smoothstep(
  0.67,
  0.88,
  gardenGroundFbm(gardenGroundPoint * 0.41 + vec2(-7.3, 5.1))
);
vec3 gardenCoolMoss = vec3(0.84, 0.93, 0.79);
vec3 gardenWarmGrass = vec3(1.09, 1.035, 0.84);
vec3 gardenPatchTint = mix(
  gardenCoolMoss,
  gardenWarmGrass,
  smoothstep(0.24, 0.78, gardenBroadPatch)
);
diffuseColor.rgb *= gardenPatchTint;
diffuseColor.rgb *= mix(0.91, 1.07, gardenMidPatch);
vec3 gardenLoam = diffuseColor.rgb * vec3(0.70, 0.66, 0.53);
diffuseColor.rgb = mix(diffuseColor.rgb, gardenLoam, gardenSoilPocket * 0.24);
diffuseColor.rgb += vec3(0.075, 0.036, -0.018) * uGroundSeasonalWarmth;
float gardenDampPatch = uGroundWetness * mix(0.58, 1.0, gardenMidPatch);
diffuseColor.rgb *= mix(1.0, uGroundColorMultiplier, gardenDampPatch);
vec3 gardenMoonlitPigment = diffuseColor.rgb * vec3(0.80, 0.91, 1.04);
diffuseColor.rgb = mix(
  diffuseColor.rgb,
  gardenMoonlitPigment,
  uGroundNightCoolness
);`,
  );
  // Wetness changes selected micro-regions while preserving an organic matte floor.
  compiled.fragmentShader = compiled.fragmentShader.replace(
    "#include <roughnessmap_fragment>",
    `#include <roughnessmap_fragment>
float gardenWetVariation = gardenGroundFbm(
  vGroundWorldPosition.xz * 0.29 + vec2(8.1, 3.4)
);
roughnessFactor = clamp(
  roughnessFactor - uGroundWetness * mix(0.07, 0.18, gardenWetVariation),
  0.68,
  0.99
);`,
  );
  // Add restrained blue-green sky bounce after direct light so night stays legible.
  compiled.fragmentShader = compiled.fragmentShader.replace(
    "#include <opaque_fragment>",
    `#include <opaque_fragment>
float gardenNightPresence = smoothstep(
  0.025,
  0.14,
  uGroundNightCoolness
);
gl_FragColor.rgb += vec3(0.038, 0.055, 0.061) * gardenNightPresence;`,
  );
  // Return the small compiled interface consumed by the atmospheric update loop.
  return compiled;
}

// Ease infrequent live observations into an already-compiled material program.
export function animateGroundShader(
  shader: CompiledGroundShader,
  atmosphere: GroundAtmosphere,
): void {
  // A shared easing amount makes weather transitions visible but never abrupt.
  const easing = 0.035;
  // Wet patches spread gradually when a new rain observation arrives.
  shader.uniforms.uGroundWetness.value = THREE.MathUtils.lerp(
    shader.uniforms.uGroundWetness.value as number,
    atmosphere.wetness,
    easing,
  );
  // Saturated pigment follows the same slow transition as its moisture source.
  shader.uniforms.uGroundColorMultiplier.value = THREE.MathUtils.lerp(
    shader.uniforms.uGroundColorMultiplier.value as number,
    atmosphere.colorMultiplier,
    easing,
  );
  // Seasonal tint changes almost imperceptibly across the annual garden cycle.
  shader.uniforms.uGroundSeasonalWarmth.value = THREE.MathUtils.lerp(
    shader.uniforms.uGroundSeasonalWarmth.value as number,
    atmosphere.seasonalWarmth,
    0.012,
  );
  // Dawn and dusk ease the ground between moonlit and daylight pigment.
  shader.uniforms.uGroundNightCoolness.value = THREE.MathUtils.lerp(
    shader.uniforms.uGroundNightCoolness.value as number,
    atmosphere.nightCoolness,
    easing,
  );
}
