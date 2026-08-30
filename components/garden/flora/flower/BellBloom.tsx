// React builds the bell profile and deterministic curled-tepal transforms.
import { useLayoutEffect, useMemo, useRef } from "react";
// Three supplies lathe profile vectors, transforms, and physical material constants.
import * as THREE from "three";
// Narrow curved petals become six gently flared tepal tips at the bell rim.
import { createFlowerPetalGeometry } from "../flower-petal-shape";
// Small cream stamens remain visible inside the open hanging corolla.
import { FlowerStamens } from "./FlowerStamens";

// Six fused bluebell tepals produce the familiar open lower rim.
const BELL_TEPAL_COUNT = 6;
// All bell flowers reuse one immutable narrow curled-tip surface.
const BELL_TEPAL_GEOMETRY = createFlowerPetalGeometry("daisy");

// A hanging bloom receives the same species colour and selection state as open blooms.
type BellBloomProps = {
  // Blue-violet pigment comes from the named flower's visual data.
  color: string;
  // Highlighting adds only a restrained corolla glow during interaction targeting.
  highlighted: boolean;
};

// Render one open, hanging, softly flared bluebell instead of a solid cone primitive.
export function BellBloom({ color, highlighted }: BellBloomProps) {
  // The radial profile creates a thin open bell wall with a gently flared mouth.
  const bellProfile = useMemo(
    () => [
      new THREE.Vector2(0.025, 0.035),
      new THREE.Vector2(0.04, 0),
      new THREE.Vector2(0.067, -0.07),
      new THREE.Vector2(0.1, -0.15),
      new THREE.Vector2(0.112, -0.205),
      new THREE.Vector2(0.104, -0.23),
    ],
    [],
  );
  // The ref exposes the six-tip mesh after React mounts it.
  const tepals = useRef<THREE.InstancedMesh>(null);

  // Arrange six short outward curls around the open lower rim once.
  useLayoutEffect(() => {
    // Stop until React has attached the instanced tepal mesh.
    if (!tepals.current) return;
    // Reuse one transform throughout the small deterministic ring.
    const transform = new THREE.Object3D();
    // Each fused tepal ends in one individually visible outward curl.
    for (let index = 0; index < BELL_TEPAL_COUNT; index += 1) {
      // Even spacing follows the six-fold structure of a bluebell corolla.
      const angle = (index * Math.PI * 2) / BELL_TEPAL_COUNT;
      // Place each narrow attachment at the bell's lower open rim.
      transform.position.set(
        Math.sin(angle) * 0.095,
        -0.215,
        Math.cos(angle) * 0.095,
      );
      // Rotation aims the local petal outward from the bell axis.
      transform.rotation.set(0.18, angle, Math.sin(index * 2.1) * 0.035);
      // Compact scaling creates a curled rim rather than a second complete bloom.
      transform.scale.set(0.28, 0.34, 0.32);
      // Store the completed rim-tip matrix in its matching GPU slot.
      transform.updateMatrix();
      tepals.current.setMatrixAt(index, transform.matrix);
    }
    // Upload every tepal matrix and update culling bounds once.
    tepals.current.instanceMatrix.needsUpdate = true;
    tepals.current.computeBoundingSphere();
  }, []);

  // One group holds the thin open wall, curled rim, and internal reproductive parts.
  return (
    <group rotation={[0.06, 0, -0.14]}>
      {/* LatheGeometry creates a hollow corolla wall open at its lower mouth. */}
      <mesh castShadow>
        <latheGeometry args={[bellProfile, 24]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.6}
          metalness={0}
          sheen={0.38}
          sheenColor={color}
          sheenRoughness={0.76}
          emissive={highlighted ? color : "#000000"}
          emissiveIntensity={highlighted ? 0.34 : 0}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Six small curved tips give the rim a botanical rather than geometric edge. */}
      <instancedMesh
        ref={tepals}
        args={[BELL_TEPAL_GEOMETRY, undefined, BELL_TEPAL_COUNT]}
      >
        <meshPhysicalMaterial
          color={color}
          vertexColors
          roughness={0.62}
          sheen={0.32}
          sheenColor={color}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
      {/* Rotate the stamen ring so its fine filaments hang inside the open bell. */}
      <group position={[0, -0.18, 0]} rotation={[Math.PI, 0, 0]}>
        <FlowerStamens count={6} radius={0.025} color="#ded19c" />
      </group>
    </group>
  );
}
