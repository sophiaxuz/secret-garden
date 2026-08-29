// The render-loop hook advances waves without causing React rerenders.
import { useFrame } from "@react-three/fiber";
// A ref retains the compiled material shader after Three creates it.
import { useCallback, useRef } from "react";
// Three supplies shader types, colors, and the material rendered by the sea.
import * as THREE from "three";
// Shared dimensions keep water level and invisible extent in one place.
import { GARDEN_LAYOUT } from "../garden-layout";
// Shared astronomical time supplies the visible Moon and current light phase.
import type { UkGardenTime } from "../lighting/uk-garden-time";
// Live weather supplies cloud, rain, wind strength, and wind direction.
import type { GardenWeather } from "../weather/garden-weather";
// A pure mapper turns environmental data into safe artistic shader controls.
import { getSeaAtmosphere, type SeaAtmosphere } from "./sea-atmosphere";

// This small interface describes only the compiled fields the animation updates.
type CompiledSeaShader = {
  // Uniforms carry live JavaScript values into the GPU program.
  uniforms: Record<string, THREE.IUniform>;
  // Vertex shader contains the standard material program before customization.
  vertexShader: string;
  // Fragment shader receives the painterly broken moon-path treatment.
  fragmentShader: string;
};

// The sea needs the same sky and weather snapshots already visible in the garden.
type SeaProps = {
  // Time controls the Moon direction, reflection strength, and base water pigment.
  time: UkGardenTime;
  // Weather controls wave motion and how cloud veils the moonlit path.
  weather: GardenWeather;
};

// Render a living, moon-responsive sea around the island beneath the fog horizon.
export function Sea({ time, weather }: SeaProps) {
  // The compiled shader ref avoids searching the scene or material every frame.
  const shaderRef = useRef<CompiledSeaShader | null>(null);
  // Calculate one small artistic snapshot whenever shared atmosphere changes.
  const atmosphere = getSeaAtmosphere(time, weather);
  // A ref gives the frame loop fresh values without forcing material recompilation.
  const atmosphereRef = useRef<SeaAtmosphere>(atmosphere);
  // Update the ref synchronously so the next frame sees the latest UK observation.
  atmosphereRef.current = atmosphere;

  // Extend Three's lit material with layered waves and a broken silver moon path.
  const prepareShader = useCallback((shader: CompiledSeaShader) => {
    // Read the latest atmosphere once while creating initial GPU uniform values.
    const initial = atmosphereRef.current;
    // Store time and weather controls that the render loop can update continuously.
    shader.uniforms.uSeaTime = { value: 0 };
    shader.uniforms.uWaveEnergy = { value: initial.waveEnergy };
    shader.uniforms.uWaveSpeed = { value: initial.waveSpeed };
    shader.uniforms.uWindDirection = {
      value: new THREE.Vector2(...initial.windDirection),
    };
    // Moon uniforms let the reflection remain tied to the real celestial direction.
    shader.uniforms.uMoonDirection = {
      value: new THREE.Vector3(...initial.moonDirection),
    };
    shader.uniforms.uMoonIntensity = {
      value: initial.moonReflectionIntensity,
    };
    shader.uniforms.uMoonColor = { value: new THREE.Color("#dceaff") };
    // Add reusable layered wave functions beside Three's common vertex helpers.
    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `#include <common>
      uniform float uSeaTime;
      uniform float uWaveEnergy;
      uniform float uWaveSpeed;
      uniform vec2 uWindDirection;
      varying vec3 vSeaWorldPosition;

      float seaWave(vec2 point, float time) {
        vec2 wind = normalize(uWindDirection + vec2(0.0001));
        vec2 across = vec2(-wind.y, wind.x);
        float forward = dot(point, wind);
        float sideways = dot(point, across);
        float movingTime = time * uWaveSpeed;
        float swell = sin(forward * 0.095 + movingTime * 0.34) * 0.065;
        float crossing = sin(sideways * 0.145 - movingTime * 0.27) * 0.045;
        float diagonal = sin((forward + sideways) * 0.22 + movingTime * 0.51) * 0.026;
        float ripple = sin(forward * 0.48 - sideways * 0.27 - movingTime * 0.72) * 0.014;
        return (swell + crossing + diagonal + ripple) * uWaveEnergy;
      }

      vec2 seaSlope(vec2 point, float time) {
        float stepSize = 0.08;
        float center = seaWave(point, time);
        float slopeX = (seaWave(point + vec2(stepSize, 0.0), time) - center) / stepSize;
        float slopeY = (seaWave(point + vec2(0.0, stepSize), time) - center) / stepSize;
        return vec2(slopeX, slopeY);
      }`,
    );
    // Exaggerate only the normals so reflections dance while geometry stays gentle.
    shader.vertexShader = shader.vertexShader.replace(
      "#include <beginnormal_vertex>",
      `vec2 waveSlope = seaSlope(position.xy, uSeaTime);
      vec3 objectNormal = normalize(vec3(-waveSlope.x * 2.8, -waveSlope.y * 2.8, 1.0));`,
    );
    // Raise and lower each subdivided vertex while retaining standard lighting and fog.
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `vec3 transformed = vec3(position);
      transformed.z += seaWave(position.xy, uSeaTime);
      vSeaWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
    );
    // Declare the environmental uniforms used only by the fragment painter.
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
      uniform float uSeaTime;
      uniform float uMoonIntensity;
      uniform vec3 uMoonDirection;
      uniform vec3 uMoonColor;
      varying vec3 vSeaWorldPosition;`,
    );
    // Layer a broken brushstroke path over Three's physically lit water color.
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      `#include <opaque_fragment>
      vec3 seaViewDirection = normalize(vViewPosition);
      float grazingLight = pow(1.0 - max(dot(normal, seaViewDirection), 0.0), 3.0);
      gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.32, 0.61, 0.69), grazingLight * 0.18);

      vec3 moonViewDirection = normalize((viewMatrix * vec4(uMoonDirection, 0.0)).xyz);
      float moonSparkle = pow(
        max(dot(reflect(-moonViewDirection, normal), seaViewDirection), 0.0),
        58.0
      );

      vec2 moonAxis = normalize(uMoonDirection.xz + vec2(0.0001));
      vec2 moonAcross = vec2(-moonAxis.y, moonAxis.x);
      vec2 waterOffset = vSeaWorldPosition.xz - cameraPosition.xz;
      float alongMoon = dot(waterOffset, moonAxis);
      float acrossMoon = dot(waterOffset, moonAcross);
      float pathWidth = mix(0.4, 4.8, smoothstep(0.0, 72.0, alongMoon));
      float silverRibbon = exp(-pow(abs(acrossMoon) / max(pathWidth, 0.01), 1.35));
      float pathReach = smoothstep(1.5, 8.0, alongMoon)
        * (1.0 - smoothstep(66.0, 90.0, alongMoon));
      float brushOne = sin(alongMoon * 1.7 - uSeaTime * 1.75 + sin(acrossMoon * 2.1));
      float brushTwo = sin(alongMoon * 0.63 + acrossMoon * 3.8 + uSeaTime * 0.86);
      float brokenBrush = smoothstep(0.18, 0.9, 0.5 + brushOne * 0.3 + brushTwo * 0.2);
      float moonPaint = (
        silverRibbon * pathReach * (0.14 + brokenBrush * 0.86)
        + moonSparkle * 0.72
      ) * uMoonIntensity;
      gl_FragColor.rgb += uMoonColor * moonPaint;`,
    );
    // Retain the complete compiled shader for lightweight time updates.
    shaderRef.current = shader;
  }, []);

  // Advance motion and copy the latest environment into existing GPU uniforms.
  useFrame(({ clock }) => {
    // The first frame may arrive before Three has compiled the material program.
    const shader = shaderRef.current;
    if (!shader) return;
    // Read the current weather and sky snapshot without recompiling the material.
    const current = atmosphereRef.current;
    // Elapsed time keeps waves smooth and independent from the display frame rate.
    shader.uniforms.uSeaTime.value = clock.elapsedTime;
    // Wind and rain alter geometry and normal energy through restrained ranges.
    shader.uniforms.uWaveEnergy.value = current.waveEnergy;
    shader.uniforms.uWaveSpeed.value = current.waveSpeed;
    // Reuse the allocated vectors rather than creating garbage on every frame.
    (shader.uniforms.uWindDirection.value as THREE.Vector2).set(
      ...current.windDirection,
    );
    (shader.uniforms.uMoonDirection.value as THREE.Vector3).set(
      ...current.moonDirection,
    );
    // Cloud and celestial phase fade the painterly reflection continuously.
    shader.uniforms.uMoonIntensity.value = current.moonReflectionIntensity;
  });

  // A highly subdivided plane gives the GPU enough vertices for gentle wave shape.
  return (
    <mesh
      position={[0, GARDEN_LAYOUT.seaLevel, GARDEN_LAYOUT.seaCenterZ]}
      rotation={[-Math.PI / 2, 0, 0]}
      userData={{ shadowCaster: false }}
    >
      {/* Ninety-six subdivisions remain light while smoothing broad visible swells. */}
      <planeGeometry
        args={[GARDEN_LAYOUT.seaSize, GARDEN_LAYOUT.seaSize, 96, 96]}
      />
      {/* Dark pigment and low roughness give moving light enough visual contrast. */}
      <meshStandardMaterial
        color={atmosphere.waterColor}
        roughness={0.22}
        metalness={0.12}
        envMapIntensity={0.95}
        onBeforeCompile={prepareShader}
        customProgramCacheKey={() => "secret-garden-sea-moon-v2"}
      />
    </mesh>
  );
}
