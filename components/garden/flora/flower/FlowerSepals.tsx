// React owns deterministic instance composition for one shared sepal geometry.
import { useLayoutEffect, useRef } from "react";
// Three supplies the one shared transform and instanced mesh type.
import * as THREE from "three";
// Narrow daisy geometry becomes pointed green sepals beneath every open bloom.
import { createFlowerPetalGeometry } from "../flower-petal-shape";

// Five sepals form a botanically familiar calyx below the coloured petals.
const SEPAL_COUNT = 5;
// Every calyx reuses one immutable narrow petal surface instead of duplicating buffers.
const SEPAL_GEOMETRY = createFlowerPetalGeometry("daisy");

// Render the supporting calyx as one instanced mesh beneath an ordinary flower.
export function FlowerSepals() {
  // This ref exposes the shared mesh after React has mounted it.
  const sepals = useRef<THREE.InstancedMesh>(null);

  // Arrange the calyx once as a quiet five-pointed supporting star.
  useLayoutEffect(() => {
    // Stop until React has attached the instanced mesh reference.
    if (!sepals.current) return;
    // Reuse one transform to compose all five stable matrices.
    const transform = new THREE.Object3D();
    // Give every sepal an evenly spaced but petal-offset direction.
    for (let index = 0; index < SEPAL_COUNT; index += 1) {
      // Offset angles reveal green tips between rather than directly under petals.
      const angle = (index * Math.PI * 2) / SEPAL_COUNT + Math.PI / SEPAL_COUNT;
      // Lower placement keeps the green calyx visible in side views.
      transform.position.set(0, -0.028, 0);
      // Rotate each local positive-Z surface around the flower's vertical axis.
      transform.rotation.set(0, angle, 0);
      // Negative vertical scale turns the petal curvature beneath the bloom.
      transform.scale.set(0.5, -0.44, 0.58 + (index % 2) * 0.05);
      // Store the completed sepal matrix.
      transform.updateMatrix();
      sepals.current.setMatrixAt(index, transform.matrix);
    }
    // Upload the full five-sepal matrix buffer once.
    sepals.current.instanceMatrix.needsUpdate = true;
    // Correct bounds preserve culling around the newly extended calyx tips.
    sepals.current.computeBoundingSphere();
  }, []);

  // Double-sided matte green keeps thin sepal surfaces visible from below.
  return (
    <instancedMesh
      ref={sepals}
      args={[SEPAL_GEOMETRY, undefined, SEPAL_COUNT]}
      userData={{ shadowCaster: false }}
    >
      <meshStandardMaterial
        vertexColors
        color="#52744c"
        roughness={0.9}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}
