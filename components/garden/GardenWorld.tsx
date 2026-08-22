// Flower and Tree hide the geometry details behind small reusable interfaces.
import { Flower } from "./Flower";
import { Tree } from "./Tree";

// Each tuple stores x, y, z, color, scale, and petal count for one flower.
const FLOWERS = [
  [-2.1, 0, 4.2, "#eee4cb", 0.85, 9],
  [2.4, 0, 3.2, "#bf7e88", 1.05, 12],
  [-3.1, 0, 0.8, "#829cc0", 0.9, 5],
  [3.4, 0, -0.8, "#e7c068", 0.72, 8],
  [-1.8, 0, -2.6, "#d397af", 1.1, 10],
  [1.7, 0, -4.2, "#efe9dc", 0.9, 9],
] as const;

// This module composes all physical objects that occupy the garden.
export function GardenWorld({ plantedCount }: { plantedCount: number }) {
  // A fragment groups scene objects without creating an extra Three.js group.
  return (
    <>
      {/* Rotate a large plane flat to create the garden floor. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        {/* The plane spans beyond the fog, so visitors never see its edge. */}
        <planeGeometry args={[40, 40, 1, 1]} />
        {/* High roughness makes the ground diffuse rather than reflective. */}
        <meshStandardMaterial color="#3f593b" roughness={1} />
      </mesh>
      {/* A narrower plane sits slightly above the ground as a path. */}
      <mesh position={[0, 0.012, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.8, 20]} />
        <meshStandardMaterial color="#70654b" roughness={1} />
      </mesh>
      {/* Generate many deterministic grass blades without storing them by hand. */}
      {Array.from({ length: 180 }, (_, index) => {
        // Modular arithmetic scatters x positions predictably across the field.
        const x = ((index * 2.37) % 18) - 9;
        // A different multiplier prevents z positions from repeating with x.
        const z = ((index * 4.13) % 20) - 10;
        // Keep the middle clear so the grass does not cover the path.
        if (Math.abs(x) < 1.25) return null;
        // Render one narrow cone as a stylized blade of grass.
        return (
          <mesh
            // The array index is stable because this generated list never reorders.
            key={index}
            position={[x, 0.2, z]}
            rotation={[0, index * 0.7, ((index % 3) - 1) * 0.14]}
          >
            {/* Vary blade height slightly to avoid perfect repetition. */}
            <coneGeometry args={[0.035, 0.4 + (index % 5) * 0.06, 5]} />
            {/* Alternate greens to create depth with very simple geometry. */}
            <meshStandardMaterial
              color={index % 3 ? "#57724c" : "#79905c"}
              roughness={1}
            />
          </mesh>
        );
      })}
      {/* Convert each static flower tuple into a Flower module instance. */}
      {FLOWERS.map(([x, y, z, color, scale, petals], index) => (
        <Flower
          key={index}
          position={[x, y, z]}
          color={color}
          scale={scale}
          petals={petals}
          bell={index === 2}
        />
      ))}
      {/* Create additional flowers from the visitor's in-memory planting count. */}
      {Array.from({ length: plantedCount }, (_, index) => (
        <Flower
          // Prefixing the key distinguishes planted flowers from initial flowers.
          key={`new-${index}`}
          // Alternate sides of the path and move each new flower farther ahead.
          position={[index % 2 ? 1.7 : -1.7, 0, 5.4 - index * 1.25]}
          // Cycle through a small warm color palette.
          color={["#e4a85e", "#b48fb8", "#efd082"][index % 3]}
          // Small size and petal variations make each memory slightly different.
          scale={0.7 + (index % 2) * 0.15}
          petals={7 + (index % 3)}
        />
      ))}
      {/* Place four differently scaled trees around the walkable area. */}
      <Tree position={[-7, 0, -2]} scale={1.2} />
      <Tree position={[7, 0, -5]} scale={1.45} />
      <Tree position={[-6, 0, -10]} scale={1.5} />
      <Tree position={[6, 0, 5]} />
    </>
  );
}
