// The render-loop hook advances waves without causing React rerenders.
import { useFrame } from "@react-three/fiber";
// A ref retains the compiled material shader after Three creates it.
import { useCallback, useRef } from "react";
// Three supplies shader types, colors, and the material rendered by the sea.
import * as THREE from "three";
// Shared dimensions keep water level and invisible extent in one place.
import { GARDEN_LAYOUT } from "../garden-layout";

// This small interface describes only the compiled fields the animation updates.
type CompiledSeaShader = {
  // Uniforms carry live JavaScript values into the GPU program.
  uniforms: Record<string, THREE.IUniform>;
  // Vertex shader contains the standard material program before customization.
  vertexShader: string;
};

// Render gently animated water around the complete island beneath the fog horizon.
export function Sea() {
  // The compiled shader ref avoids searching the scene or material every frame.
  const shaderRef = useRef<CompiledSeaShader | null>(null);

  // Extend Three's lit standard material with three overlapping wave families.
  const prepareShader = useCallback((shader: CompiledSeaShader) => {
    // Store one time value that the render loop can advance continuously.
    shader.uniforms.uSeaTime = { value: 0 };
    // Add reusable wave-height and slope functions beside Three's common helpers.
    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `#include <common>
      uniform float uSeaTime;

      float seaWave(vec2 point, float time) {
        return sin(point.x * 0.17 + time * 0.38) * 0.075
          + sin(point.y * 0.21 - time * 0.29) * 0.055
          + sin((point.x + point.y) * 0.095 + time * 0.2) * 0.09;
      }

      vec2 seaSlope(vec2 point, float time) {
        float slopeX = cos(point.x * 0.17 + time * 0.38) * 0.01275
          + cos((point.x + point.y) * 0.095 + time * 0.2) * 0.00855;
        float slopeY = cos(point.y * 0.21 - time * 0.29) * 0.01155
          + cos((point.x + point.y) * 0.095 + time * 0.2) * 0.00855;
        return vec2(slopeX, slopeY);
      }`,
    );
    // Replace the flat plane normal with the analytical slope of those waves.
    shader.vertexShader = shader.vertexShader.replace(
      "#include <beginnormal_vertex>",
      `vec2 waveSlope = seaSlope(position.xy, uSeaTime);
      vec3 objectNormal = normalize(vec3(-waveSlope.x, -waveSlope.y, 1.0));`,
    );
    // Raise and lower each subdivided vertex while retaining standard lighting and fog.
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `vec3 transformed = vec3(position);
      transformed.z += seaWave(position.xy, uSeaTime);`,
    );
    // Retain the complete compiled shader for lightweight time updates.
    shaderRef.current = shader;
  }, []);

  // Advance only one numeric uniform before each rendered frame.
  useFrame(({ clock }) => {
    // The first frame may arrive before Three has compiled the material program.
    const shader = shaderRef.current;
    if (!shader) return;
    // Elapsed time keeps waves smooth and independent from the display frame rate.
    shader.uniforms.uSeaTime.value = clock.elapsedTime;
  });

  // A highly subdivided plane gives the GPU enough vertices for gentle wave shape.
  return (
    <mesh
      position={[0, GARDEN_LAYOUT.seaLevel, GARDEN_LAYOUT.pathCenterZ]}
      rotation={[-Math.PI / 2, 0, 0]}
      userData={{ shadowCaster: false }}
    >
      {/* Ninety-six subdivisions remain light while smoothing the nearby waterline. */}
      <planeGeometry
        args={[GARDEN_LAYOUT.seaSize, GARDEN_LAYOUT.seaSize, 96, 96]}
      />
      {/* Standard material preserves live Sun, Moon, environment, and fog response. */}
      <meshStandardMaterial
        color="#4a929d"
        roughness={0.32}
        metalness={0.08}
        envMapIntensity={0.85}
        onBeforeCompile={prepareShader}
        customProgramCacheKey={() => "secret-garden-sea-v1"}
      />
    </mesh>
  );
}
