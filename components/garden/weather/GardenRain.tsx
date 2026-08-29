// Fiber provides the camera position and frame loop for local moving rainfall.
import { useFrame, useThree } from "@react-three/fiber";
// React memoizes drop state and exposes the single instanced rain mesh.
import { useMemo, useRef } from "react";
// Three supplies reusable transform mathematics for one-draw-call rain.
import * as THREE from "three";
// Live weather determines density, speed, and wind direction.
import type { GardenWeather } from "./garden-weather";

// The maximum remains visually full while preserving one modest instance buffer.
const MAX_RAIN_DROPS = 620;
// Rain follows the visitor inside a square larger than the immediate camera view.
const RAIN_FIELD_WIDTH = 30;
// Drops wrap vertically through this local atmospheric height.
const RAIN_FIELD_HEIGHT = 16;

// Keep pseudo-random drop placement stable between renders and visits.
function seededUnit(index: number, salt: number): number {
  // A deterministic sine hash avoids allocating or storing random generators.
  const wave = Math.sin(index * 15.371 + salt * 73.917) * 18_273.143;
  // Removing the integer portion leaves a positive value from zero to one.
  return wave - Math.floor(wave);
}

// Each mutable drop stores its position and stable individual streak length.
type RainDrop = { x: number; y: number; z: number; length: number };

// Render camera-local rain as hundreds of fine streaks in one GPU draw call.
export function GardenRain({ weather }: { weather: GardenWeather }) {
  // The instance reference receives new drop matrices on rainy frames.
  const rainRef = useRef<THREE.InstancedMesh>(null);
  // The camera keeps rainfall around the visitor across the larger garden.
  const camera = useThree((state) => state.camera);
  // Stable mutable positions avoid creating hundreds of objects every frame.
  const drops = useMemo<RainDrop[]>(
    () =>
      Array.from({ length: MAX_RAIN_DROPS }, (_, index) => ({
        x: (seededUnit(index, 1) - 0.5) * RAIN_FIELD_WIDTH,
        y: seededUnit(index, 2) * RAIN_FIELD_HEIGHT,
        z: (seededUnit(index, 3) - 0.5) * RAIN_FIELD_WIDTH,
        length: 0.7 + seededUnit(index, 4) * 0.9,
      })),
    [],
  );
  // One reusable transform prevents a temporary object allocation on every frame.
  const transform = useMemo(() => new THREE.Object3D(), []);

  // Advance visible rain continuously without triggering React renders.
  useFrame((_, delta) => {
    // Dry weather leaves the instance buffer untouched and invisible.
    if (!rainRef.current || weather.rainIntensity <= 0) return;
    // Retain one stable mesh reference for the complete frame update.
    const rain = rainRef.current;
    // Density grows from a readable drizzle to a full shower.
    const visibleDrops = Math.round(
      100 + weather.rainIntensity * (MAX_RAIN_DROPS - 100),
    );
    // Wind direction describes where wind comes from, so add half a turn for travel.
    const windRadians = (weather.windDirectionDegrees + 180) * (Math.PI / 180);
    // A restrained scale prevents real gust speeds flinging rain horizontally.
    const windDistance = weather.windSpeedKph * 0.025 * delta;
    const windX = Math.sin(windRadians) * windDistance;
    const windZ = Math.cos(windRadians) * windDistance;
    // Tilt depends on observed wind speed rather than the visitor's frame rate.
    const windTilt = Math.min(0.34, weather.windSpeedKph * 0.006);
    // Heavier rain falls faster while retaining legible streak length.
    const fallDistance = (8 + weather.rainIntensity * 10) * delta;
    // Update only the portion of the instance buffer visible in this condition.
    for (let index = 0; index < visibleDrops; index += 1) {
      const drop = drops[index];
      // Move downward and follow the observed wind vector.
      drop.y -= fallDistance;
      drop.x += windX;
      drop.z += windZ;
      // Recycle drops above the field after they pass the visitor's ground plane.
      if (drop.y < 0) drop.y += RAIN_FIELD_HEIGHT;
      // Horizontal wrapping makes wind continuous around the camera-local field.
      if (drop.x > RAIN_FIELD_WIDTH / 2) drop.x -= RAIN_FIELD_WIDTH;
      if (drop.x < -RAIN_FIELD_WIDTH / 2) drop.x += RAIN_FIELD_WIDTH;
      if (drop.z > RAIN_FIELD_WIDTH / 2) drop.z -= RAIN_FIELD_WIDTH;
      if (drop.z < -RAIN_FIELD_WIDTH / 2) drop.z += RAIN_FIELD_WIDTH;
      // Position the shared fine cylinder at this drop's local coordinate.
      transform.position.set(drop.x, drop.y, drop.z);
      // Tilt streaks subtly in the same direction as their wind travel.
      transform.rotation.set(
        Math.cos(windRadians) * windTilt,
        0,
        -Math.sin(windRadians) * windTilt,
      );
      // Unequal streak lengths break the former uniform synthetic rain pattern.
      transform.scale.set(1, drop.length, 1);
      transform.updateMatrix();
      rain.setMatrixAt(index, transform.matrix);
    }
    // Draw only the active density rather than all reserved instances.
    rain.count = visibleDrops;
    // Upload the changed transforms once after the complete loop.
    rain.instanceMatrix.needsUpdate = true;
    // Keep the local effect centered on the visitor's horizontal position.
    rain.position.set(camera.position.x, 0.1, camera.position.z);
  });

  // The mesh remains mounted so changing weather begins without allocation delay.
  return (
    <instancedMesh
      ref={rainRef}
      args={[undefined, undefined, MAX_RAIN_DROPS]}
      count={0}
      visible={weather.rainIntensity > 0}
      frustumCulled={false}
      renderOrder={5}
      userData={{ shadowCaster: false }}
    >
      {/* Four radial sides make each distant streak fine and inexpensive. */}
      <cylinderGeometry args={[0.006, 0.011, 0.5, 4]} />
      {/* Low additive light gives rain presence without restoring the white glare. */}
      <meshBasicMaterial
        color="#89a7b4"
        transparent
        opacity={0.1 + weather.rainIntensity * 0.12}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}
