// Three exposes DoubleSide so thin leaves remain visible from either direction.
import * as THREE from "three";
// The shared outline keeps every flower leaf pointed and botanical.
import { createFlowerLeafShape } from "./flower-leaf-shape";

// Create the immutable outline once instead of rebuilding it during each render.
const FLOWER_LEAF_SHAPE = createFlowerLeafShape();

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
      {/* ShapeGeometry turns the curved almond outline into a thin leaf blade. */}
      <mesh>
        {/* Extra curve segments keep both leaf edges gently rounded. */}
        <shapeGeometry args={[FLOWER_LEAF_SHAPE, 12]} />
        {/* A matte mid-green surface avoids the old shiny fruit-like appearance. */}
        <meshStandardMaterial
          color="#55764d"
          roughness={1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* A narrow raised cylinder suggests the leaf's natural central vein. */}
      <mesh position={[0, 0, 0.008]}>
        {/* The vein stops before both pointed ends to stay inside the blade. */}
        <cylinderGeometry args={[0.008, 0.012, 0.4, 6]} />
        {/* A quieter dark green keeps the detail soft at garden scale. */}
        <meshStandardMaterial color="#3d603e" roughness={1} />
      </mesh>
    </group>
  );
}
