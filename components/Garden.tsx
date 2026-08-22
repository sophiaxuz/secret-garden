"use client";

import { Environment, PointerLockControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type FlowerProps = {
  position: [number, number, number];
  color: string;
  scale?: number;
  petals?: number;
  bell?: boolean;
};

function Flower({
  position,
  color,
  scale = 1,
  petals = 8,
  bell = false,
}: FlowerProps) {
  const angles = useMemo(
    () =>
      Array.from(
        { length: petals },
        (_, index) => (index * Math.PI * 2) / petals,
      ),
    [petals],
  );
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.025, 0.045, 1.4, 8]} />
        <meshStandardMaterial color="#34543a" roughness={0.9} />
      </mesh>
      <mesh position={[-0.14, 0.5, 0]} rotation={[0, 0, -0.8]}>
        <sphereGeometry args={[0.2, 12, 8]} />
        <meshStandardMaterial color="#55764d" roughness={1} />
      </mesh>
      <group
        position={[0, 1.42, 0]}
        rotation={bell ? [Math.PI, 0, 0] : [0, 0, 0]}
      >
        {angles.map((angle) => (
          <mesh
            key={angle}
            position={[Math.cos(angle) * 0.19, Math.sin(angle) * 0.19, 0]}
            rotation={[0, 0, angle - Math.PI / 2]}
          >
            {bell ? (
              <coneGeometry args={[0.14, 0.36, 12]} />
            ) : (
              <sphereGeometry args={[0.22, 0.08, 0.08, 16, 8]} />
            )}
            <meshStandardMaterial
              color={color}
              roughness={0.65}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
        {!bell && (
          <mesh position={[0, 0, 0.045]}>
            <sphereGeometry args={[0.13, 20, 12]} />
            <meshStandardMaterial color="#d8a83b" roughness={0.9} />
          </mesh>
        )}
      </group>
    </group>
  );
}

function Tree({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 2.1, 0]}>
        <cylinderGeometry args={[0.22, 0.38, 4.2, 9]} />
        <meshStandardMaterial color="#3a3b28" roughness={1} />
      </mesh>
      <mesh position={[0, 4.2, 0]}>
        <dodecahedronGeometry args={[1.65, 1]} />
        <meshStandardMaterial color="#294c35" roughness={1} />
      </mesh>
      <mesh position={[-0.9, 4, 0.2]}>
        <dodecahedronGeometry args={[1.05, 1]} />
        <meshStandardMaterial color="#365c3c" roughness={1} />
      </mesh>
    </group>
  );
}

function GardenWorld({ plantedCount }: { plantedCount: number }) {
  const flowers = useMemo(
    () =>
      [
        [-2.1, 0, 4.2, "#eee4cb", 0.85, 9],
        [2.4, 0, 3.2, "#bf7e88", 1.05, 12],
        [-3.1, 0, 0.8, "#829cc0", 0.9, 5],
        [3.4, 0, -0.8, "#e7c068", 0.72, 8],
        [-1.8, 0, -2.6, "#d397af", 1.1, 10],
        [1.7, 0, -4.2, "#efe9dc", 0.9, 9],
      ] as const,
    [],
  );
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40, 1, 1]} />
        <meshStandardMaterial color="#3f593b" roughness={1} />
      </mesh>
      <mesh position={[0, 0.012, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.8, 20]} />
        <meshStandardMaterial color="#70654b" roughness={1} />
      </mesh>
      {Array.from({ length: 180 }, (_, index) => {
        const x = ((index * 2.37) % 18) - 9;
        const z = ((index * 4.13) % 20) - 10;
        if (Math.abs(x) < 1.25) return null;
        return (
          <mesh
            key={index}
            position={[x, 0.2, z]}
            rotation={[0, index * 0.7, ((index % 3) - 1) * 0.14]}
          >
            <coneGeometry args={[0.035, 0.4 + (index % 5) * 0.06, 5]} />
            <meshStandardMaterial
              color={index % 3 ? "#57724c" : "#79905c"}
              roughness={1}
            />
          </mesh>
        );
      })}
      {flowers.map(([x, y, z, color, scale, petals], index) => (
        <Flower
          key={index}
          position={[x, y, z]}
          color={color}
          scale={scale}
          petals={petals}
          bell={index === 2}
        />
      ))}
      {Array.from({ length: plantedCount }, (_, index) => (
        <Flower
          key={`new-${index}`}
          position={[index % 2 ? 1.7 : -1.7, 0, 5.4 - index * 1.25]}
          color={["#e4a85e", "#b48fb8", "#efd082"][index % 3]}
          scale={0.7 + (index % 2) * 0.15}
          petals={7 + (index % 3)}
        />
      ))}
      <Tree position={[-7, 0, -2]} scale={1.2} />
      <Tree position={[7, 0, -5]} scale={1.45} />
      <Tree position={[-6, 0, -10]} scale={1.5} />
      <Tree position={[6, 0, 5]} />
    </>
  );
}

function FirstPerson({ active }: { active: boolean }) {
  const keys = useRef(new Set<string>());
  const forwardDirection = useRef(new THREE.Vector3());
  const rightDirection = useRef(new THREE.Vector3());
  const touchStart = useRef<[number, number] | null>(null);
  const [touchDevice, setTouchDevice] = useState(false);
  const { camera, gl } = useThree();
  useEffect(() => {
    setTouchDevice(window.matchMedia("(pointer: coarse)").matches);
    const down = (event: KeyboardEvent) => {
      if (
        !["INPUT", "TEXTAREA", "BUTTON"].includes(
          (event.target as HTMLElement).tagName,
        )
      )
        keys.current.add(event.code);
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.code);
    const clear = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);
  useEffect(() => {
    if (!active || !touchDevice) return;
    const element = gl.domElement;
    const start = (event: TouchEvent) => {
      const touch = event.touches[0];
      touchStart.current = [touch.clientX, touch.clientY];
    };
    const move = (event: TouchEvent) => {
      if (!touchStart.current) return;
      const touch = event.touches[0];
      const dx = touch.clientX - touchStart.current[0];
      const dy = touch.clientY - touchStart.current[1];
      camera.rotation.order = "YXZ";
      camera.rotation.y -= dx * 0.004;
      camera.rotation.x = THREE.MathUtils.clamp(
        camera.rotation.x - dy * 0.003,
        -1.1,
        1.1,
      );
      touchStart.current = [touch.clientX, touch.clientY];
    };
    const end = () => {
      touchStart.current = null;
    };
    element.addEventListener("touchstart", start);
    element.addEventListener("touchmove", move);
    element.addEventListener("touchend", end);
    return () => {
      element.removeEventListener("touchstart", start);
      element.removeEventListener("touchmove", move);
      element.removeEventListener("touchend", end);
    };
  }, [active, camera, gl, touchDevice]);
  useFrame((_, delta) => {
    if (!active) return;
    const forward =
      Number(keys.current.has("KeyW") || keys.current.has("ArrowUp")) -
      Number(keys.current.has("KeyS") || keys.current.has("ArrowDown"));
    const sideways =
      Number(keys.current.has("KeyD") || keys.current.has("ArrowRight")) -
      Number(keys.current.has("KeyA") || keys.current.has("ArrowLeft"));
    const direction = forwardDirection.current;
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    const right = rightDirection.current
      .crossVectors(direction, camera.up)
      .normalize();
    camera.position.addScaledVector(direction, forward * delta * 2.2);
    camera.position.addScaledVector(right, sideways * delta * 2.2);
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -8, 8);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -10, 8);
    camera.position.y =
      1.62 +
      Math.sin(performance.now() * 0.004) *
        (forward || sideways ? 0.018 : 0.006);
  });
  return active && !touchDevice ? <PointerLockControls /> : null;
}

export default function Garden({
  plantedCount,
  entered,
}: {
  plantedCount: number;
  entered: boolean;
}) {
  return (
    <Canvas camera={{ position: [0, 1.62, 7], fov: 62 }} dpr={[1, 1.6]} shadows>
      <color attach="background" args={["#829078"]} />
      <fog attach="fog" args={["#829078", 8, 23]} />
      <hemisphereLight intensity={1.15} color="#fff2ca" groundColor="#243626" />
      <directionalLight
        position={[-5, 9, 4]}
        intensity={2.3}
        color="#ffe5ad"
        castShadow
      />
      <GardenWorld plantedCount={plantedCount} />
      <Environment preset="forest" />
      <FirstPerson active={entered} />
    </Canvas>
  );
}
