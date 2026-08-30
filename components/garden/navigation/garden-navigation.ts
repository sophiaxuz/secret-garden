// Shared garden dimensions are the single source of truth for walkable limits.
import { GARDEN_LAYOUT } from "../garden-layout";
// Tree placement and visible trunk size define the static environmental obstacles.
import { GARDEN_TREES, TREE_TRUNK_RADIUS } from "../flora/garden-trees";

// This radius gives the first-person camera a body instead of treating it as a point.
const VISITOR_RADIUS = 0.34;
// A tiny gap prevents floating-point rounding from leaving the visitor inside bark.
const COLLISION_GAP = 0.002;
// Refreshing below the Canvas debounce avoids resolution pulses during long walks.
export const GARDEN_QUALITY_HEARTBEAT_SECONDS = 0.15;

// Decide when motion should trade a little pixel density for immediate response.
export function shouldRegressGardenQuality(
  forward: number,
  sideways: number,
  cameraRotationRadians: number,
  secondsSinceLastRequest = Number.POSITIVE_INFINITY,
): boolean {
  // Keyboard travel or a perceptible look gesture means the camera is moving.
  const moving =
    forward !== 0 || sideways !== 0 || cameraRotationRadians > 0.0001;
  // A periodic heartbeat keeps the recovery timer postponed without frame-by-frame churn.
  return moving && secondsSinceLastRequest >= GARDEN_QUALITY_HEARTBEAT_SECONDS;
}

// Navigation needs only horizontal coordinates, not a complete Three.js vector.
type GardenPosition = {
  // X describes movement from the garden's western edge to its eastern edge.
  x: number;
  // Z describes movement between the entrance and the garden's deeper edge.
  z: number;
};

// A circular footprint is enough for resolving movement around a vertical trunk.
type TreeCollider = {
  // X and Z locate the collider at the same horizontal point as its rendered tree.
  x: number;
  z: number;
  // Radius already includes both visible bark and the visitor's body clearance.
  radius: number;
};

// Derive collision footprints from render data so trees cannot drift out of sync.
const TREE_COLLIDERS: readonly TreeCollider[] = GARDEN_TREES.map(
  ({ position, scale }) => ({
    // Tree tuples store horizontal coordinates in their first and third entries.
    x: position[0],
    z: position[2],
    // Scaling affects the trunk and therefore must affect its collider equally.
    radius: TREE_TRUNK_RADIUS * scale + VISITOR_RADIUS,
  }),
);

// Clamp horizontal coordinates to the garden's rectangular outer boundary.
function clampToGardenBounds(position: GardenPosition): void {
  // Limit east-west movement to the visible habitat width.
  position.x = Math.min(
    GARDEN_LAYOUT.bounds.maxX,
    Math.max(GARDEN_LAYOUT.bounds.minX, position.x),
  );
  // Limit entrance-to-depth movement to the visible habitat length.
  position.z = Math.min(
    GARDEN_LAYOUT.bounds.maxZ,
    Math.max(GARDEN_LAYOUT.bounds.minZ, position.z),
  );
}

// Find the first point where one movement segment enters a circular collider.
function findFirstContact(
  previous: GardenPosition,
  proposed: GardenPosition,
  collider: TreeCollider,
): number | null {
  // Movement is the line segment travelled during this animation frame.
  const movementX = proposed.x - previous.x;
  const movementZ = proposed.z - previous.z;
  // The quadratic coefficient is also the squared movement length.
  const movementLengthSquared = movementX ** 2 + movementZ ** 2;
  // A stationary visitor cannot sweep through a collider.
  if (movementLengthSquared === 0) return null;
  // Express the segment's starting point relative to the trunk centre.
  const startX = previous.x - collider.x;
  const startZ = previous.z - collider.z;
  // Starting inside needs radial recovery rather than an entry calculation.
  if (startX ** 2 + startZ ** 2 < collider.radius ** 2) return null;
  // These coefficients solve the segment-versus-circle quadratic equation.
  const linearTerm = 2 * (startX * movementX + startZ * movementZ);
  const constantTerm = startX ** 2 + startZ ** 2 - collider.radius ** 2;
  // A negative discriminant means the movement never reaches this trunk.
  const discriminant =
    linearTerm ** 2 - 4 * movementLengthSquared * constantTerm;
  if (discriminant < 0) return null;
  // The smaller root is the first contact point along the movement segment.
  const contact =
    (-linearTerm - Math.sqrt(discriminant)) / (2 * movementLengthSquared);
  // Only intersections between the old and proposed positions affect this frame.
  return contact >= 0 && contact <= 1 ? contact : null;
}

// Push one proposed position out of a trunk while retaining tangential movement.
function resolveTreeCollision(
  position: GardenPosition,
  previousPosition: GardenPosition | undefined,
  collider: TreeCollider,
): void {
  // Continuous contact prevents a long or delayed frame from crossing a whole tree.
  const contact = previousPosition
    ? findFirstContact(previousPosition, position, collider)
    : null;
  if (contact !== null && previousPosition) {
    // Recreate the movement segment once for the contact and remaining slide.
    const movementX = position.x - previousPosition.x;
    const movementZ = position.z - previousPosition.z;
    // Calculate the exact first point where the visitor reaches the trunk clearance.
    const contactX = previousPosition.x + movementX * contact;
    const contactZ = previousPosition.z + movementZ * contact;
    // The contact normal points from the tree centre toward the visitor.
    const normalX = (contactX - collider.x) / collider.radius;
    const normalZ = (contactZ - collider.z) / collider.radius;
    // Preserve only the portion of the remaining movement parallel to the trunk.
    const remainingX = position.x - contactX;
    const remainingZ = position.z - contactZ;
    const inwardMovement = Math.min(
      0,
      remainingX * normalX + remainingZ * normalZ,
    );
    // Move to contact, add a safety gap, and keep the sideways sliding component.
    position.x =
      contactX +
      normalX * COLLISION_GAP +
      (remainingX - normalX * inwardMovement);
    position.z =
      contactZ +
      normalZ * COLLISION_GAP +
      (remainingZ - normalZ * inwardMovement);
  }

  // Measure the resolved point relative to the trunk for final penetration cleanup.
  const offsetX = position.x - collider.x;
  const offsetZ = position.z - collider.z;
  const distanceSquared = offsetX ** 2 + offsetZ ** 2;
  // Positions already outside this footprint need no further work.
  if (distanceSquared >= collider.radius ** 2) return;
  // Prefer the proposed direction, falling back to the approach side at the centre.
  const fallbackX = previousPosition ? previousPosition.x - collider.x : 1;
  const fallbackZ = previousPosition ? previousPosition.z - collider.z : 0;
  let directionX = distanceSquared > 0 ? offsetX : fallbackX;
  let directionZ = distanceSquared > 0 ? offsetZ : fallbackZ;
  // Measure the recovery direction before guarding an exact centre-to-centre case.
  let directionLength = Math.hypot(directionX, directionZ);
  // Choose east when neither the proposal nor its previous point gives a direction.
  if (directionLength === 0) {
    directionX = 1;
    directionZ = 0;
    directionLength = 1;
  }
  const safeRadius = collider.radius + COLLISION_GAP;
  // Project the visitor to the nearest safe point immediately outside the trunk.
  position.x = collider.x + (directionX / directionLength) * safeRadius;
  position.z = collider.z + (directionZ / directionLength) * safeRadius;
}

// Move an existing position to the nearest walkable point after every frame.
export function keepVisitorInsideGarden(
  position: GardenPosition,
  previousPosition?: GardenPosition,
): void {
  // Resolve the outer rectangle before testing its contained tree obstacles.
  clampToGardenBounds(position);
  // Resolve every static trunk from the same data used to render the garden.
  for (const collider of TREE_COLLIDERS) {
    resolveTreeCollision(position, previousPosition, collider);
  }
  // Keep every resolved camera position within the current outer garden boundary.
  clampToGardenBounds(position);
}
