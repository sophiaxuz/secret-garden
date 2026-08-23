// Shared dimensions keep the floor, path, grass, and navigation aligned.
import { GARDEN_LAYOUT } from "../garden-layout";
// Grass hides thousands of procedural blades behind one instanced mesh.
import { Grass } from "./Grass";

// Render every non-interactive surface that forms the garden terrain.
export function GardenTerrain() {
  // A fragment groups terrain without adding an unnecessary transform node.
  return (
    <>
      {/* Rotate a large plane flat to create the garden floor. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        userData={{ shadowCaster: false }}
      >
        {/* The plane spans beyond the fog, so visitors never see its edge. */}
        <planeGeometry
          args={[GARDEN_LAYOUT.groundWidth, GARDEN_LAYOUT.groundDepth, 1, 1]}
        />
        {/* High roughness makes the ground diffuse rather than reflective. */}
        <meshStandardMaterial color="#3f593b" roughness={1} />
      </mesh>
      {/* A narrower plane sits slightly above the ground as a path. */}
      <mesh
        position={[0, 0.012, GARDEN_LAYOUT.pathCenterZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        userData={{ shadowCaster: false }}
      >
        <planeGeometry
          args={[GARDEN_LAYOUT.pathWidth, GARDEN_LAYOUT.pathLength]}
        />
        <meshStandardMaterial color="#70654b" roughness={1} />
      </mesh>
      {/* Render deterministic meadow tufts through one GPU-instanced mesh. */}
      <Grass />
    </>
  );
}
