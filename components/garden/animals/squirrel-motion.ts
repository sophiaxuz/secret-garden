// Tree placement and archetype measurements keep the climb attached to real bark.
import {
  getGardenTreeById,
  TREE_BRANCH_PERCH_LOCAL_POSITION,
  TREE_TRUNK_HEIGHT,
  TREE_TRUNK_RADIUS,
  TREE_TRUNK_TOP_RADIUS,
} from "../flora/garden-trees";
// Habitat data names Hazel's resting patch and chosen climb tree.
import { ANIMAL_HABITATS, type HabitatPoint } from "./animal-habitats";

// One complete behavior loop includes rest, travel, climbing, and branch time.
const SQUIRREL_CYCLE_SECONDS = 26;
// Ground height matches the squirrel's established habitat anchor.
const GROUND_Y = ANIMAL_HABITATS.squirrel.start[1];

// These activity names describe every visitor-observable part of the journey.
export type SquirrelMotionPhase =
  | "resting"
  | "approaching"
  | "climbing"
  | "perched"
  | "descending"
  | "returning";

// This is the complete renderer-independent squirrel pose at one instant.
export type SquirrelMotion = {
  // Position stores world X, Y, and Z in the same order as Three.js.
  position: [number, number, number];
  // Phase lets animation details respond to the current meaningful behavior.
  phase: SquirrelMotionPhase;
  // Heading turns Hazel around the vertical garden axis.
  heading: number;
  // Pitch tilts her toward vertical bark during ascent and descent.
  pitch: number;
  // Motion energy drives paws and tail without duplicating route calculations.
  motionEnergy: number;
};

// Look up the named tree once so every frame reuses the same stable placement.
const CLIMB_TREE = getGardenTreeById(ANIMAL_HABITATS.squirrel.treeId);
// Copy the immutable habitat tuple into the mutable tuple shape returned to renderers.
const GROUND_START: [number, number, number] = [
  ...ANIMAL_HABITATS.squirrel.start,
];
// Body clearance places Hazel's center outside bark while her paws meet it.
const SQUIRREL_BODY_CLEARANCE = 0.18;
// Convert the shared local perch point through the Moss oak's position and scale.
const BRANCH_PERCH: [number, number, number] = [
  CLIMB_TREE.position[0] +
    TREE_BRANCH_PERCH_LOCAL_POSITION[0] * CLIMB_TREE.scale,
  CLIMB_TREE.position[1] +
    TREE_BRANCH_PERCH_LOCAL_POSITION[1] * CLIMB_TREE.scale,
  CLIMB_TREE.position[2] +
    TREE_BRANCH_PERCH_LOCAL_POSITION[2] * CLIMB_TREE.scale,
];

// Keep a numeric value between two inclusive limits.
function clamp(value: number, minimum: number, maximum: number): number {
  // Nested bounds make every phase safe at its exact transition instant.
  return Math.min(maximum, Math.max(minimum, value));
}

// Ease a zero-to-one journey without abrupt starts or stops.
function smoothProgress(progress: number): number {
  // Clamp before applying the cubic smoothstep curve.
  const bounded = clamp(progress, 0, 1);
  // This curve has zero slope at both endpoints.
  return bounded * bounded * (3 - 2 * bounded);
}

// Interpolate one complete world position between two habitat points.
function interpolatePoint(
  from: HabitatPoint,
  to: HabitatPoint,
  progress: number,
): [number, number, number] {
  // Blend every axis with the same eased journey amount.
  return [
    from[0] + (to[0] - from[0]) * progress,
    from[1] + (to[1] - from[1]) * progress,
    from[2] + (to[2] - from[2]) * progress,
  ];
}

// Calculate the Three.js yaw that faces one horizontal point from another.
function headingBetween(from: HabitatPoint, to: HabitatPoint): number {
  // Atan2 preserves the correct direction in every garden quadrant.
  return Math.atan2(to[0] - from[0], to[2] - from[2]);
}

// Calculate contact distance from the same tapered trunk rendered by Tree.
function climbRadiusAtHeight(worldY: number): number {
  // Convert world height back into the tree archetype's local coordinates.
  const localY = (worldY - CLIMB_TREE.position[1]) / CLIMB_TREE.scale;
  // Limit the taper calculation to the visible trunk's bottom and top.
  const trunkProgress = clamp(localY / TREE_TRUNK_HEIGHT, 0, 1);
  // Linearly narrow the local radius toward the top of the trunk.
  const localRadius =
    TREE_TRUNK_RADIUS +
    (TREE_TRUNK_TOP_RADIUS - TREE_TRUNK_RADIUS) * trunkProgress;
  // Scale bark into world space and add only Hazel's body-to-paw clearance.
  return localRadius * CLIMB_TREE.scale + SQUIRREL_BODY_CLEARANCE;
}

// Place Hazel around the real trunk while she moves vertically through its height.
function positionOnTrunk(progress: number): [number, number, number] {
  // One full turn begins and ends on the branch-facing side of the tree.
  const angle = progress * Math.PI * 2;
  // Blend ground height into branch height while circling the bark.
  const y = GROUND_Y + (BRANCH_PERCH[1] - GROUND_Y) * progress;
  // Follow the narrowing bark instead of floating at one bottom-width radius.
  const climbRadius = climbRadiusAtHeight(y);
  // Maintain a small body-width clearance outside the visible trunk.
  return [
    CLIMB_TREE.position[0] + Math.cos(angle) * climbRadius,
    y,
    CLIMB_TREE.position[2] + Math.sin(angle) * climbRadius,
  ];
}

// The ground route ends at the same bark contact where ascent begins.
const TRUNK_BASE = positionOnTrunk(0);
// The upper spiral ends here before Hazel steps outward onto the branch.
const TRUNK_BRANCH_CONTACT = positionOnTrunk(1);

// Reuse the same bounding gait for outward and homeward ground travel.
function getGroundJourney(
  from: HabitatPoint,
  to: HabitatPoint,
  rawProgress: number,
  phase: "approaching" | "returning",
): SquirrelMotion {
  // Ease this four-second journey before interpolating its world position.
  const progress = smoothProgress(rawProgress);
  // Interpolate first, then add repeated squirrel-like bounds.
  const position = interpolatePoint(from, to, progress);
  // Nine quick arcs make the route read as bounding rather than gliding.
  position[1] += Math.abs(Math.sin(progress * Math.PI * 9)) * 0.14;
  // Return one directional ground pose for both outward and return travel.
  return {
    position,
    phase,
    heading: headingBetween(from, to),
    pitch: -0.08,
    motionEnergy: Math.sin(progress * Math.PI),
  };
}

// Return Hazel's complete world pose for any elapsed garden time.
export function getSquirrelMotion(elapsedTime: number): SquirrelMotion {
  // Modulo repeats the same calm journey indefinitely.
  const cycle =
    ((elapsedTime % SQUIRREL_CYCLE_SECONDS) + SQUIRREL_CYCLE_SECONDS) %
    SQUIRREL_CYCLE_SECONDS;

  // Rest near the foraging patch before setting off toward the tree.
  if (cycle < 3) {
    // A tiny sniffing lift keeps the grounded pause alive.
    const sniffLift = Math.abs(Math.sin(cycle * 2.2)) * 0.035;
    // Face the trunk base while softly scanning the nearby garden.
    const heading = headingBetween(GROUND_START, TRUNK_BASE);
    // Return a complete resting pose without leaking phase calculations to React.
    return {
      position: [GROUND_START[0], GROUND_START[1] + sniffLift, GROUND_START[2]],
      phase: "resting",
      heading: heading + Math.sin(cycle * 1.2) * 0.18,
      pitch: 0.08,
      motionEnergy: 0,
    };
  }

  // Scamper from the foraging patch to the foot of the Moss oak.
  if (cycle < 7) {
    // Delegate the complete outward bound through the shared ground helper.
    return getGroundJourney(
      GROUND_START,
      TRUNK_BASE,
      (cycle - 3) / 4,
      "approaching",
    );
  }

  // Spiral upward, then step smoothly from bark onto the outer branch.
  if (cycle < 11) {
    // Spend most of this phase climbing the tapered trunk itself.
    const trunkProgress = smoothProgress((cycle - 7) / 3.2);
    // Reserve the final fraction for a visible bark-to-branch transfer.
    const transferProgress = smoothProgress((cycle - 10.2) / 0.8);
    // Stay on bark first, then interpolate along the physical branch.
    const position =
      cycle < 10.2
        ? positionOnTrunk(trunkProgress)
        : interpolatePoint(
            TRUNK_BRANCH_CONTACT,
            BRANCH_PERCH,
            transferProgress,
          );
    // Use the real trunk center to keep Hazel's face toward the bark.
    const heading =
      cycle < 10.2
        ? headingBetween(position, CLIMB_TREE.position)
        : headingBetween(CLIMB_TREE.position, BRANCH_PERCH);
    // Gradually level the body as Hazel steps outward onto the branch.
    const pitch = -1.05 + transferProgress;
    // Return active gripping motion that calms only near the perch.
    return {
      position,
      phase: "climbing",
      heading,
      pitch,
      motionEnergy: 1 - transferProgress * 0.85,
    };
  }

  // Pause visibly on the low branch beneath the Moss oak canopy.
  if (cycle < 15) {
    // Normalize the four-second pause so its breathing can fade at both edges.
    const perchProgress = (cycle - 11) / 4;
    // A sine envelope reaches zero exactly when Hazel arrives and departs.
    const breathingEnvelope = Math.sin(perchProgress * Math.PI);
    // A tiny enveloped lift keeps the pose alive without causing a boundary jump.
    const breathingLift =
      Math.sin((cycle - 11) * 2.1) * 0.025 * breathingEnvelope;
    // Face outward along the branch while watching the garden.
    const heading = headingBetween(CLIMB_TREE.position, BRANCH_PERCH);
    // Return the stable perch position derived from tree render data.
    return {
      position: [
        BRANCH_PERCH[0],
        BRANCH_PERCH[1] + breathingLift,
        BRANCH_PERCH[2],
      ],
      phase: "perched",
      heading,
      pitch: -0.05,
      motionEnergy: 0.15,
    };
  }

  // Descend briskly along the same trunk after the branch pause.
  if (cycle < 19) {
    // First step inward from the branch to the upper bark contact.
    const transferProgress = smoothProgress((cycle - 15) / 0.8);
    // Ease the remaining top-to-bottom scramble to avoid a first-frame lurch.
    const descent = smoothProgress((cycle - 15.8) / 3.2);
    // Reverse the spiral progress from branch height toward the ground.
    const trunkProgress = 1 - descent;
    // Transfer onto bark first, then follow its taper back to the ground.
    const position =
      cycle < 15.8
        ? interpolatePoint(BRANCH_PERCH, TRUNK_BRANCH_CONTACT, transferProgress)
        : positionOnTrunk(trunkProgress);
    // Face outward during transfer, then turn toward bark for descent.
    const heading =
      cycle < 15.8
        ? headingBetween(CLIMB_TREE.position, BRANCH_PERCH)
        : headingBetween(position, CLIMB_TREE.position);
    // Tip gradually from the branch pose into a head-down trunk pose.
    const pitch = cycle < 15.8 ? -0.05 + transferProgress * 1.1 : 1.05;
    // Return the continuous descent pose and energetic gripping motion.
    return {
      position,
      phase: "descending",
      heading,
      pitch,
      motionEnergy: 1,
    };
  }

  // Bound back from the tree to the original western resting patch.
  if (cycle < 23) {
    // Delegate the mirrored homeward bound through the same ground helper.
    return getGroundJourney(
      TRUNK_BASE,
      GROUND_START,
      (cycle - 19) / 4,
      "returning",
    );
  }

  // Settle into a stiller rest before the twenty-six-second loop repeats.
  return {
    position: [...GROUND_START],
    phase: "resting",
    heading: headingBetween(GROUND_START, TRUNK_BASE),
    pitch: 0,
    motionEnergy: 0,
  };
}
