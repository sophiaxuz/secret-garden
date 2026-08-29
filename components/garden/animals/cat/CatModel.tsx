// RefObject describes the animated attachment points supplied by Cat.
import type { RefObject } from "react";
// Three supplies the concrete scene-object types stored by those refs.
import type * as THREE from "three";

// The rig groups every movable part behind one internal model interface.
export type CatRig = {
  body: RefObject<THREE.Group>;
  head: RefObject<THREE.Group>;
  tail: RefObject<THREE.Group>;
  tailTip: RefObject<THREE.Group>;
  leftPaw: RefObject<THREE.Mesh>;
  rightPaw: RefObject<THREE.Mesh>;
  leftHindLeg: RefObject<THREE.Mesh>;
  rightHindLeg: RefObject<THREE.Mesh>;
};

// Render only the cat's appearance while Cat owns its behavior and route.
export function CatModel({
  rig,
  sleeping,
}: {
  // Rig exposes the movable body parts owned by Cat's behaviour module.
  rig: CatRig;
  // Sleeping closes the existing eye geometry without adding extra meshes.
  sleeping: boolean;
}) {
  // A fragment lets the parent root group transform every model part together.
  return (
    <>
      {/* The torso and head share a group that rises into the sitting pose. */}
      <group ref={rig.body}>
        {/* A slim oval forms the cat's flexible torso. */}
        <mesh scale={[0.58, 0.54, 1.05]}>
          <sphereGeometry args={[0.68, 17, 11]} />
          <meshStandardMaterial color="#777873" roughness={1} />
        </mesh>
        {/* A lighter chest patch adds depth beneath the face. */}
        <mesh position={[0, 0.02, 0.64]} scale={[0.38, 0.44, 0.2]}>
          <sphereGeometry args={[0.7, 13, 9]} />
          <meshStandardMaterial color="#c8c3b7" roughness={1} />
        </mesh>
        {/* Group every facial feature so the cat can look around. */}
        <group ref={rig.head} position={[0, 0.3, 0.82]}>
          {/* A rounded head keeps the stylized cat soft and approachable. */}
          <mesh scale={[0.84, 0.78, 0.76]}>
            <sphereGeometry args={[0.5, 16, 10]} />
            <meshStandardMaterial color="#7f807b" roughness={1} />
          </mesh>
          {/* Two triangular ears create the cat's unmistakable silhouette. */}
          <mesh position={[-0.28, 0.43, -0.02]} rotation={[0, 0, -0.08]}>
            <coneGeometry args={[0.18, 0.48, 7]} />
            <meshStandardMaterial color="#686a66" roughness={1} />
          </mesh>
          <mesh position={[0.28, 0.43, -0.02]} rotation={[0, 0, 0.08]}>
            <coneGeometry args={[0.18, 0.48, 7]} />
            <meshStandardMaterial color="#686a66" roughness={1} />
          </mesh>
          {/* Green eyes stand out against the grey face. */}
          <mesh
            position={[-0.2, 0.08, 0.36]}
            scale={[1.15, sleeping ? 0.1 : 0.82, 0.72]}
          >
            <sphereGeometry args={[0.075, 10, 7]} />
            <meshStandardMaterial color="#a8bf73" roughness={0.35} />
          </mesh>
          <mesh
            position={[0.2, 0.08, 0.36]}
            scale={[1.15, sleeping ? 0.1 : 0.82, 0.72]}
          >
            <sphereGeometry args={[0.075, 10, 7]} />
            <meshStandardMaterial color="#a8bf73" roughness={0.35} />
          </mesh>
          {/* Narrow pupils make the green eyes read clearly as feline. */}
          <mesh
            position={[-0.2, 0.08, 0.42]}
            scale={[0.32, 1, 0.3]}
            visible={!sleeping}
          >
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshBasicMaterial color="#171916" />
          </mesh>
          <mesh
            position={[0.2, 0.08, 0.42]}
            scale={[0.32, 1, 0.3]}
            visible={!sleeping}
          >
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshBasicMaterial color="#171916" />
          </mesh>
          {/* A pale muzzle sits below the eyes. */}
          <mesh position={[0, -0.12, 0.39]} scale={[0.45, 0.25, 0.18]}>
            <sphereGeometry args={[0.7, 12, 8]} />
            <meshStandardMaterial color="#d5d0c5" roughness={1} />
          </mesh>
          {/* A tiny muted-pink nose completes the central face. */}
          <mesh position={[0, -0.055, 0.52]} scale={[1.1, 0.72, 0.75]}>
            <sphereGeometry args={[0.065, 9, 6]} />
            <meshStandardMaterial color="#9d6e6b" roughness={0.65} />
          </mesh>
          {/* Three fine whiskers extend from each side of the muzzle. */}
          {[-1, 1].map((side) =>
            [-0.08, 0, 0.08].map((height) => (
              <mesh
                key={`${side}-${height}`}
                position={[side * 0.34, -0.12 + height, 0.45]}
                rotation={[0, 0, Math.PI / 2 + height * side]}
              >
                <cylinderGeometry args={[0.006, 0.006, 0.36, 5]} />
                <meshBasicMaterial color="#403f3b" />
              </mesh>
            )),
          )}
        </group>
      </group>
      {/* Four slim legs connect the cat's body to the ground. */}
      <mesh ref={rig.leftPaw} position={[-0.28, -0.46, 0.52]}>
        <cylinderGeometry args={[0.08, 0.1, 0.65, 8]} />
        <meshStandardMaterial color="#70716d" roughness={1} />
      </mesh>
      <mesh ref={rig.rightPaw} position={[0.28, -0.46, 0.52]}>
        <cylinderGeometry args={[0.08, 0.1, 0.65, 8]} />
        <meshStandardMaterial color="#70716d" roughness={1} />
      </mesh>
      <mesh ref={rig.leftHindLeg} position={[-0.28, -0.46, -0.48]}>
        <cylinderGeometry args={[0.09, 0.11, 0.65, 8]} />
        <meshStandardMaterial color="#70716d" roughness={1} />
      </mesh>
      <mesh ref={rig.rightHindLeg} position={[0.28, -0.46, -0.48]}>
        <cylinderGeometry args={[0.09, 0.11, 0.65, 8]} />
        <meshStandardMaterial color="#70716d" roughness={1} />
      </mesh>
      {/* Two linked tail sections create a curled, expressive shape. */}
      <group
        ref={rig.tail}
        position={[0, 0.08, -0.88]}
        rotation={[-0.7, 0, -0.38]}
      >
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.09, 0.13, 0.9, 9]} />
          <meshStandardMaterial color="#676965" roughness={1} />
        </mesh>
        <group
          ref={rig.tailTip}
          position={[0, 0.86, 0]}
          rotation={[0, 0, 0.35]}
        >
          <mesh position={[0, 0.33, 0]}>
            <cylinderGeometry args={[0.065, 0.095, 0.66, 9]} />
            <meshStandardMaterial color="#676965" roughness={1} />
          </mesh>
        </group>
      </group>
    </>
  );
}
