// Three exposes DoubleSide so thin leaves remain visible from either direction.
import * as THREE from "three";
// The shared geometry keeps every flower leaf pointed, folded, and botanical.
import { createFlowerLeafGeometry } from "./flower-leaf-shape";

// Create the immutable curved blade once instead of rebuilding it for every leaf.
const FLOWER_LEAF_GEOMETRY = createFlowerLeafGeometry();

// These values let each leaf occupy a different place around the flower stem.
type FlowerLeafProps = {
  // Position stores the leaf centre as garden-local x, y, and z coordinates.
  position: readonly [number, number, number];
  // Rotation tilts the leaf in three dimensions so it does not look paper-flat.
  rotation: readonly [number, number, number];
  // Scale creates natural size variation between the two leaves.
  scale?: number;
};

// Render one pointed leaf with a subtle raised central vein.
export function FlowerLeaf({ position, rotation, scale = 1 }: FlowerLeafProps) {
  // Group transforms move the blade and its vein as one botanical part.
  return (
    <group position={[...position]} rotation={[...rotation]} scale={scale}>
      {/* The shared folded geometry catches light across a real curved surface. */}
      <mesh geometry={FLOWER_LEAF_GEOMETRY} castShadow>
        {/* A physical leaf material adds quiet sheen without plastic gloss. */}
        <meshPhysicalMaterial
          color="#55764d"
          roughness={0.82}
          sheen={0.16}
          sheenColor="#78956b"
          sheenRoughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* A narrow raised cylinder suggests the leaf's natural central vein. */}
      <mesh position={[0, 0, 0.027]}>
        {/* The vein stops before both pointed ends to stay inside the blade. */}
        <cylinderGeometry args={[0.004, 0.007, 0.4, 6]} />
        {/* A quieter dark green keeps the detail soft at garden scale. */}
        <meshStandardMaterial color="#3d603e" roughness={1} />
      </mesh>
    </group>
  );
}
