"use client";

import { ContactShadows, Environment, Float, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

type FlowerProps = { position: [number, number, number]; color: string; scale?: number; petals?: number; bell?: boolean };

function Flower({ position, color, scale = 1, petals = 8, bell = false }: FlowerProps) {
  const petalPositions = useMemo(() => Array.from({ length: petals }, (_, i) => i * Math.PI * 2 / petals), [petals]);
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, .7, 0]}><cylinderGeometry args={[.028, .045, 1.4, 8]} /><meshStandardMaterial color="#49613d" roughness={.8} /></mesh>
      <mesh position={[-.13, .48, 0]} rotation={[0, 0, -.8]}><sphereGeometry args={[.18, 12, 8]} /><meshStandardMaterial color="#607b4c" roughness={.9} /></mesh>
      <group position={[0, 1.42, 0]} rotation={bell ? [Math.PI, 0, 0] : [0, 0, 0]}>
        {petalPositions.map((angle) => (
          <mesh key={angle} position={[Math.cos(angle) * .19, Math.sin(angle) * .19, 0]} rotation={[0, 0, angle - Math.PI / 2]}>
            {bell ? <coneGeometry args={[.14, .36, 12]} /> : <sphereGeometry args={[.22, .08, .08, 16, 8]} />}
            <meshStandardMaterial color={color} roughness={.65} side={THREE.DoubleSide} />
          </mesh>
        ))}
        {!bell && <mesh position={[0, 0, .045]}><sphereGeometry args={[.13, 20, 12]} /><meshStandardMaterial color="#d8a83b" roughness={.9} /></mesh>}
      </group>
    </group>
  );
}

function Ground() {
  return (
    <group>
      <mesh position={[0, -.03, 0]} scale={[3.2, .16, 2.15]}><sphereGeometry args={[1, 64, 32]} /><meshStandardMaterial color="#516b3f" roughness={1} /></mesh>
      {Array.from({ length: 36 }, (_, i) => {
        const x = ((i * 1.73) % 5.2) - 2.6;
        const z = ((i * 2.31) % 3.2) - 1.6;
        return <mesh key={i} position={[x, .12, z]} rotation={[0, 0, (i % 3 - 1) * .25]}><coneGeometry args={[.025, .28 + i % 4 * .04, 5]} /><meshStandardMaterial color={i % 2 ? "#76915d" : "#3d5937"} /></mesh>;
      })}
    </group>
  );
}

const demoPositions: [number, number, number][] = [[.72, .08, .8], [-.55, .08, .92], [1.55, .08, -.55], [-1.8, .08, -.65]];

export default function Garden({ plantedCount }: { plantedCount: number }) {
  return (
    <Canvas camera={{ position: [3.8, 2.4, 5.4], fov: 34 }} dpr={[1, 1.8]}>
      <color attach="background" args={["#dce6d4"]} />
      <fog attach="fog" args={["#dce6d4", 6, 10]} />
      <ambientLight intensity={1.35} />
      <directionalLight position={[-3, 6, 4]} intensity={2.5} color="#fff6d9" castShadow />
      <Float speed={1.2} rotationIntensity={.025} floatIntensity={.08}>
        <Ground />
        <Flower position={[-1.25, .08, .18]} color="#f4eee0" scale={.9} petals={9} />
        <Flower position={[.15, .08, -.45]} color="#d7858c" scale={1.25} petals={12} />
        <Flower position={[1.25, .08, .18]} color="#8da5cb" scale={.85} petals={5} bell />
        {Array.from({ length: plantedCount }, (_, index) => (
          <Flower key={index} position={demoPositions[index % demoPositions.length]} color={["#e4a85e", "#b48fb8", "#efd082", "#d27c68"][index % 4]} scale={.62 + index % 3 * .08} petals={7 + index % 3} />
        ))}
      </Float>
      <ContactShadows position={[0, -.12, 0]} opacity={.32} scale={7} blur={2.5} far={4} />
      <Environment preset="forest" />
      <OrbitControls enablePan={false} minDistance={4.5} maxDistance={7} minPolarAngle={.85} maxPolarAngle={1.4} autoRotate autoRotateSpeed={.18} />
    </Canvas>
  );
}
