// React manages deterministic GPU instance setup for shared petal geometry.
import { useLayoutEffect, useRef } from "react";
// Three supplies colours, transforms, and physically based petal materials.
import * as THREE from "three";
// The curved factory gives each archetype its own botanical petal proportions.
import { createFlowerPetalGeometry } from "../flower-petal-shape";
// One catalogue entry owns this profile's geometry, center, and tissue surface.
import {
  FLOWER_ARCHETYPE_STYLES,
  type FlowerPetalProfile,
} from "./flower-archetype";
// Sepals form the green supporting calyx visible beneath side-facing flowers.
import { FlowerSepals } from "./FlowerSepals";
// Fine instanced stamens replace the old single spherical yellow centre.
import { FlowerStamens } from "./FlowerStamens";

// One immutable geometry per profile is shared by every matching garden flower.
const FLOWER_PETAL_GEOMETRIES = {
  daisy: createFlowerPetalGeometry("daisy"),
  rose: createFlowerPetalGeometry("rose"),
  buttercup: createFlowerPetalGeometry("buttercup"),
  cosmos: createFlowerPetalGeometry("cosmos"),
  meadow: createFlowerPetalGeometry("meadow"),
} satisfies Record<FlowerPetalProfile, THREE.BufferGeometry>;

// Open blooms share one renderer while profile and rings preserve species identity.
type FlowerBloomProps = {
  // Petal hue comes from the flower's authored or identified species data.
  color: string;
  // Profile selects ray, cup, rose, cosmos, or balanced memory proportions.
  profile: FlowerPetalProfile;
  // Petal count follows recognisable botanical structure for each species.
  petals: number;
  // Multiple overlapping rings are reserved for genuinely fuller blooms.
  layers: number;
  // Selection adds a subtle bloom-level emissive lift without recolouring details.
  highlighted: boolean;
};

// Render a species-aware flower head with curved petals and detailed reproductive parts.
export function FlowerBloom({
  color,
  profile,
  petals,
  layers,
  highlighted,
}: FlowerBloomProps) {
  // Read the one immutable surface shared by every flower of this archetype.
  const petalGeometry = FLOWER_PETAL_GEOMETRIES[profile];
  // This ref exposes the one instanced petal mesh after React mounts it.
  const petalMesh = useRef<THREE.InstancedMesh>(null);
  // All concentric petal rings remain inside a single GPU draw call.
  const visiblePetalCount = petals * layers;
  // Centre proportions remain cohesive with the selected botanical profile.
  const style = FLOWER_ARCHETYPE_STYLES[profile];
  const centre = style.centre;

  // Fill every petal matrix and colour once when bloom identity changes.
  useLayoutEffect(() => {
    // Stop until the instanced mesh is available through its React ref.
    if (!petalMesh.current) return;
    // Reuse one transform instead of allocating an object for every petal.
    const transform = new THREE.Object3D();
    // Reuse one colour while creating tiny deterministic petal pigment shifts.
    const instanceColor = new THREE.Color();

    // Compose every ring and radial slot inside one predictable loop.
    for (let index = 0; index < visiblePetalCount; index += 1) {
      // Integer division identifies the concentric ring owning this petal.
      const layer = Math.floor(index / petals);
      // The remainder identifies the current radial position within that ring.
      const petalIndex = index % petals;
      // Alternating rings rotate half a slot so natural overlaps hide attachment gaps.
      const angle =
        (petalIndex * Math.PI * 2) / petals +
        (layer * Math.PI) / Math.max(petals, 1);
      // Inner rings sit closer to the receptacle and rise more steeply.
      const layerProgress = layers === 1 ? 0 : layer / (layers - 1);
      // A tiny irregular radius prevents a visibly perfect manufactured circle.
      const radialVariation = Math.sin((petalIndex + 1) * 12.9898) * 0.006;
      const radius = 0.016 - layerProgress * 0.006 + radialVariation;
      // Local positive Z points outward after rotation around the world Y axis.
      transform.position.set(
        Math.sin(angle) * radius,
        layer * 0.008,
        Math.cos(angle) * radius,
      );
      // Slight roll and pitch differences give every petal an independent edge line.
      const roll = Math.sin((petalIndex + 2) * 4.17) * 0.035;
      const pitch = -layerProgress * 0.12 + Math.cos(petalIndex * 2.3) * 0.015;
      transform.rotation.set(pitch, angle, roll);
      // Inner petals shorten naturally while neighboring outer petals vary subtly.
      const layerScale = 1 - layerProgress * 0.23;
      const sizeVariation = 0.96 + Math.sin((petalIndex + 3) * 7.31) * 0.035;
      transform.scale.set(
        sizeVariation * layerScale,
        layerScale,
        sizeVariation * layerScale,
      );
      // Convert position, rotation, and scale into one instance matrix.
      transform.updateMatrix();
      // Store this petal's complete spatial transform in its GPU slot.
      petalMesh.current.setMatrixAt(index, transform.matrix);
      // Begin from the authored species hue before adding living pigment variation.
      instanceColor.set(color);
      // Alternate lightness by only a few percent to preserve one cohesive flower.
      instanceColor.offsetHSL(
        Math.sin(index * 1.71) * 0.006,
        Math.cos(index * 2.19) * 0.018,
        Math.sin(index * 3.11) * 0.025,
      );
      // Store the subtle hue variation without creating extra materials.
      petalMesh.current.setColorAt(index, instanceColor);
    }
    // Upload completed matrices and per-instance pigments to the GPU.
    petalMesh.current.instanceMatrix.needsUpdate = true;
    if (petalMesh.current.instanceColor) {
      petalMesh.current.instanceColor.needsUpdate = true;
    }
    // Updated bounds keep the complete radial bloom visible during culling.
    petalMesh.current.computeBoundingSphere();
  }, [color, layers, petals, visiblePetalCount]);

  // One group aligns sepals, petals, receptacle, and stamens at the stem tip.
  return (
    <group>
      {/* Green sepals remain visible between petals from low viewing angles. */}
      <FlowerSepals />
      {/* A rounded receptacle joins the stem and calyx without a hard intersection. */}
      <mesh position={[0, -0.035, 0]} scale={[1, 0.52, 1]}>
        <sphereGeometry args={[centre.radius * 1.08, 16, 10]} />
        <meshStandardMaterial color="#4f7147" roughness={0.9} />
      </mesh>
      {/* All curved coloured petals render through one shared physical material. */}
      <instancedMesh
        ref={petalMesh}
        args={[petalGeometry, undefined, visiblePetalCount]}
        castShadow
      >
        <meshPhysicalMaterial
          vertexColors
          color="#fffaf2"
          roughness={style.surface.roughness}
          metalness={0}
          sheen={style.surface.sheen}
          sheenColor={color}
          sheenRoughness={0.78}
          clearcoat={style.surface.clearcoat}
          clearcoatRoughness={0.8}
          transmission={style.surface.transmission}
          thickness={0.035}
          emissive={highlighted ? color : "#000000"}
          emissiveIntensity={highlighted ? 0.36 : 0}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
      {/* A flattened composite disc replaces the old oversized spherical centre. */}
      <mesh position={[0, 0.034, 0]} scale={[1, 0.34, 1]} castShadow>
        <sphereGeometry args={[centre.radius, 20, 10]} />
        <meshStandardMaterial color={centre.color} roughness={0.78} />
      </mesh>
      {/* Fine filaments and anthers supply the close-range detail real flowers need. */}
      <FlowerStamens
        count={centre.stamens}
        radius={centre.radius * 0.56}
        color={centre.color}
        arrangement={centre.arrangement}
      />
    </group>
  );
}
