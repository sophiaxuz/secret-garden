// React memoizes the botanical curve so rerenders never rebuild tube geometry.
import { useMemo } from "react";
// Three creates the gently curved path followed by the stem tube.
import * as THREE from "three";

// Bell stems bow farther to support a naturally hanging flower head.
type FlowerStemProps = {
  // This flag changes only the upper curve while preserving one stem component.
  hanging?: boolean;
  // Highlighting adds a restrained shared glow to the complete selected flower.
  highlighted?: boolean;
};

// A branch or flower stalk joins two authored points with a softly bowed tube.
type FlowerStemSegmentProps = {
  // The branch begins where it leaves the main stem or raceme.
  from: readonly [number, number, number];
  // The branch ends exactly at the bloom's attachment point.
  to: readonly [number, number, number];
  // Fine pedicels remain narrower than supporting rose canes.
  radius?: number;
};

// Render a continuous secondary stem for branching roses and bluebell pedicels.
export function FlowerStemSegment({
  from,
  to,
  radius = 0.011,
}: FlowerStemSegmentProps) {
  // Curve the midpoint slightly so the connector never reads as a rigid rod.
  const branchCurve = useMemo(() => {
    // Average both ends before adding a small organic sideways bow.
    const midpoint = new THREE.Vector3(
      (from[0] + to[0]) / 2 + (to[2] - from[2]) * 0.08,
      (from[1] + to[1]) / 2 + 0.018,
      (from[2] + to[2]) / 2 - (to[0] - from[0]) * 0.045,
    );
    // Three control points are enough for a delicate naturally tensioned stalk.
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(...from),
      midpoint,
      new THREE.Vector3(...to),
    ]);
  }, [from, to]);

  // One tiny tube follows the complete curved branch from stem to flower head.
  return (
    <mesh>
      <tubeGeometry args={[branchCurve, 9, radius, 6, false]} />
      <meshStandardMaterial color="#416743" roughness={0.88} />
    </mesh>
  );
}

// Render a continuous curved stem rather than a mechanically straight cylinder.
export function FlowerStem({
  hanging = false,
  highlighted = false,
}: FlowerStemProps) {
  // Build a smooth center line from the grounded base to the flower receptacle.
  const stemCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        // The first point keeps the tube rooted at the flower's group origin.
        new THREE.Vector3(0, 0, 0),
        // A slight lower bow makes the plant feel grown rather than assembled.
        new THREE.Vector3(-0.018, 0.38, 0.012),
        // The middle reverses gently to create an irregular but stable stem line.
        new THREE.Vector3(0.025, 0.79, -0.012),
        // Hanging flowers lean before the final pedicel reaches the bell.
        new THREE.Vector3(hanging ? 0.1 : -0.008, 1.13, 0),
      ]),
    [hanging],
  );

  // One tube supplies a continuous silhouette and smoothly changing highlights.
  return (
    <mesh>
      {/* Fine radial segments retain a round stem without wasting triangles. */}
      <tubeGeometry args={[stemCurve, 18, 0.018, 7, false]} />
      {/* Natural green remains matte while selected plants gain only a faint lift. */}
      <meshStandardMaterial
        color="#416743"
        roughness={0.86}
        emissive={highlighted ? "#294b2f" : "#000000"}
        emissiveIntensity={highlighted ? 0.22 : 0}
      />
    </mesh>
  );
}
