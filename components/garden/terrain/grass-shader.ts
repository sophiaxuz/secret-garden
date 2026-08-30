// Three supplies material compilation types and reusable vector interpolation.
import * as THREE from "three";
// The shader reads the renderer-independent atmosphere produced from live weather.
import type { GrassAtmosphere } from "./grass-atmosphere";

// This is the small part of Three's compiled shader retained for live uniforms.
export type CompiledGrassShader = {
  // The frame loop updates these values without rebuilding a React component.
  uniforms: Record<string, THREE.IUniform>;
};

// Add silhouette variation, natural tonality, and wind to a standard lit material.
export function compileGrassShader(
  compiled: THREE.WebGLProgramParametersWithUniforms,
  atmosphere: GrassAtmosphere,
): CompiledGrassShader {
  // Time advances both slow gusts and tiny independent blade flutter.
  compiled.uniforms.uGrassTime = { value: 0 };
  // Sway strength is the authored visual translation of live wind and rain.
  compiled.uniforms.uSwayStrength = { value: atmosphere.swayStrength };
  // Gust speed controls how calmly weather crosses the complete meadow.
  compiled.uniforms.uGustSpeed = { value: atmosphere.gustSpeed };
  // Flutter stays small and appears only near the finest blade tips.
  compiled.uniforms.uFlutterStrength = { value: atmosphere.flutterStrength };
  // A vector keeps every patch responding to one real-world wind direction.
  compiled.uniforms.uWindDirection = {
    value: new THREE.Vector2(...atmosphere.windDirection),
  };
  // Declare custom geometry attributes, uniforms, and the height varying once.
  compiled.vertexShader = compiled.vertexShader.replace(
    "#include <common>",
    `#include <common>
attribute float windPhase;
attribute vec2 instanceVariation;
uniform float uGrassTime;
uniform float uSwayStrength;
uniform float uGustSpeed;
uniform float uFlutterStrength;
uniform vec2 uWindDirection;
varying float vGrassHeight;`,
  );
  // Replace only the stock position opening while retaining later Three chunks.
  compiled.vertexShader = compiled.vertexShader.replace(
    "#include <begin_vertex>",
    `vec3 transformed = vec3(position);
vGrassHeight = clamp(position.y, 0.0, 1.0);
float bladeProfile = 0.5 + 0.5 * sin(
  windPhase * 3.91 + instanceVariation.x * 6.28318
);
transformed.y *= mix(0.78, 1.16, bladeProfile);
transformed.xz *= mix(0.88, 1.14, instanceVariation.y);
vec2 grassOrigin = vec2(0.0);
vec2 localWindDirection = uWindDirection;
#ifdef USE_INSTANCING
  grassOrigin = instanceMatrix[3].xz;
  vec2 localXAxis = normalize(instanceMatrix[0].xz);
  vec2 localZAxis = normalize(instanceMatrix[2].xz);
  localWindDirection = normalize(vec2(
    dot(localXAxis, uWindDirection),
    dot(localZAxis, uWindDirection)
  ));
#endif
float tipInfluence = smoothstep(0.06, 1.0, vGrassHeight);
tipInfluence *= tipInfluence;
float travellingGust = sin(
  dot(grassOrigin, uWindDirection) * 0.115 +
  uGrassTime * uGustSpeed +
  windPhase * 0.21
);
float softGust = 0.64 + travellingGust * 0.24;
float bladeFlutter = sin(
  uGrassTime * (2.15 + uGustSpeed * 0.38) +
  windPhase * 2.73 +
  dot(grassOrigin, vec2(0.07, -0.05))
);
transformed.xz += localWindDirection *
  tipInfluence *
  (uSwayStrength * softGust + uFlutterStrength * bladeFlutter);
transformed.x += bladeFlutter * uFlutterStrength * tipInfluence * 0.24;`,
  );
  // Share blade height with the fragment shader for root-to-tip tonality.
  compiled.fragmentShader = compiled.fragmentShader.replace(
    "#include <common>",
    `#include <common>
varying float vGrassHeight;`,
  );
  // Add delicate warm tip lift after vertex colour without flattening shadows.
  compiled.fragmentShader = compiled.fragmentShader.replace(
    "#include <color_fragment>",
    `#include <color_fragment>
float grassTipLight = smoothstep(0.42, 1.0, vGrassHeight);
diffuseColor.rgb *= mix(
  vec3(0.88, 0.91, 0.82),
  vec3(1.08, 1.11, 0.96),
  grassTipLight
);`,
  );
  // Return the compiled uniform interface needed by the animation frame loop.
  return compiled;
}

// Ease live weather into one already-compiled shader without React rerenders.
export function animateGrassShader(
  shader: CompiledGrassShader,
  atmosphere: GrassAtmosphere,
  elapsedTime: number,
  windTarget: THREE.Vector2,
): void {
  // Advance slow gust bands with the renderer's monotonic elapsed time.
  shader.uniforms.uGrassTime.value = elapsedTime;
  // Ease live weather changes so a fresh forecast never snaps the field abruptly.
  shader.uniforms.uSwayStrength.value = THREE.MathUtils.lerp(
    shader.uniforms.uSwayStrength.value as number,
    atmosphere.swayStrength,
    0.025,
  );
  // Gust speed can ease with the same gentle atmospheric transition.
  shader.uniforms.uGustSpeed.value = THREE.MathUtils.lerp(
    shader.uniforms.uGustSpeed.value as number,
    atmosphere.gustSpeed,
    0.025,
  );
  // Fine flutter also grows gradually as rain or wind strengthens.
  shader.uniforms.uFlutterStrength.value = THREE.MathUtils.lerp(
    shader.uniforms.uFlutterStrength.value as number,
    atmosphere.flutterStrength,
    0.025,
  );
  // Direction uses vector interpolation before normalization for smooth turning.
  const direction = shader.uniforms.uWindDirection.value as THREE.Vector2;
  // Update the reusable target from the newest meteorological direction.
  windTarget.set(...atmosphere.windDirection);
  // Turn gently toward the target so forecast updates never jerk every blade.
  direction.lerp(windTarget, 0.018).normalize();
}
