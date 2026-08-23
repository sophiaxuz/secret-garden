// The IANA zone follows both Greenwich Mean Time and British Summer Time.
const UK_TIME_ZONE = "Europe/London";
// London provides one stable geographic anchor for the garden's UK sky.
const LONDON_LATITUDE = 51.5074;
const LONDON_LONGITUDE = -0.1278;
// A fixed radius places celestial bodies beyond the garden but inside the camera.
const CELESTIAL_DISTANCE = 52;
// These helpers keep the astronomical equations readable in degrees.
const DEGREES_TO_RADIANS = Math.PI / 180;
const RADIANS_TO_DEGREES = 180 / Math.PI;

// The four phases are the only lighting states the interface exposes to callers.
export type GardenLightPhase = "night" | "dawn" | "day" | "dusk";
// UK seasons give the clock a familiar description of the garden's year.
export type GardenSeason = "spring" | "summer" | "autumn" | "winter";
// A tuple passes Three.js-compatible coordinates without importing the renderer.
export type CelestialPosition = [number, number, number];

// This is the complete time-and-light interface consumed by React and Three.js.
export type UkGardenTime = {
  // The original instant gives the semantic clock element a machine-readable value.
  isoDateTime: string;
  // Time uses UK civil rules and includes seconds so visitors can see it is live.
  timeLabel: string;
  // Date uses natural British ordering and wording.
  dateLabel: string;
  // Zone distinguishes GMT from BST when daylight saving changes.
  zoneLabel: string;
  // Season and period turn astronomical state into quiet garden language.
  season: GardenSeason;
  periodLabel: string;
  phase: GardenLightPhase;
  // Opposing positions keep the active celestial light above the horizon.
  sunPosition: CelestialPosition;
  moonPosition: CelestialPosition;
  // Intensities let the scene transition continuously rather than switching abruptly.
  sunIntensity: number;
  moonIntensity: number;
  hemisphereIntensity: number;
  environmentIntensity: number;
  // Colors coordinate the background, fog, atmosphere, and directional lights.
  skyColor: string;
  fogColor: string;
  hemisphereColor: string;
  sunColor: string;
};

// Reuse formatters because constructing Intl formatters every second is unnecessary.
const UK_PARTS_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: UK_TIME_ZONE,
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  timeZoneName: "short",
});
// A dedicated formatter produces the readable label beneath the live clock.
const UK_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: UK_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

// Keep values inside a circular range such as angles or clock hours.
function modulo(value: number, range: number): number {
  // JavaScript remainder can be negative, so add one range before taking it again.
  return ((value % range) + range) % range;
}

// Keep a value within inclusive numeric limits.
function clamp(value: number, minimum: number, maximum: number): number {
  // Nested min and max calls avoid leaking renderer-specific math helpers.
  return Math.min(maximum, Math.max(minimum, value));
}

// Ease a value from zero to one across two thresholds.
function smoothStep(edgeStart: number, edgeEnd: number, value: number): number {
  // Normalize and clamp before applying the cubic smoothstep curve.
  const progress = clamp((value - edgeStart) / (edgeEnd - edgeStart), 0, 1);
  // This polynomial has a gentle zero-slope transition at both ends.
  return progress * progress * (3 - 2 * progress);
}

// Convert a six-digit hexadecimal color into independent red, green, and blue bytes.
function parseHex(color: string): [number, number, number] {
  // Removing the hash lets each two-character channel parse as base sixteen.
  const value = color.slice(1);
  // Return channels in the same order CSS and Three.js expect.
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

// Blend two hexadecimal colors without importing a graphics library into this seam.
function mixHex(start: string, end: string, amount: number): string {
  // Read both colors as numeric channels before interpolation.
  const startChannels = parseHex(start);
  const endChannels = parseHex(end);
  // Limit callers to a meaningful interpolation range.
  const mix = clamp(amount, 0, 1);
  // Blend and serialize every channel back to a two-character hexadecimal string.
  const channels = startChannels.map((channel, index) =>
    Math.round(channel + (endChannels[index] - channel) * mix)
      .toString(16)
      .padStart(2, "0"),
  );
  // Reattach the CSS hash to the combined channel string.
  return `#${channels.join("")}`;
}

// Read the UK-local calendar and clock fields from one absolute instant.
function getUkParts(instant: Date) {
  // Format-to-parts avoids parsing locale-dependent punctuation.
  const parts = UK_PARTS_FORMATTER.formatToParts(instant);
  // Convert named parts into a small lookup map.
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  // Return only the fields used by the public garden-time calculation.
  return {
    month: Number(values.month),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
    zoneLabel: values.timeZoneName,
  };
}

// Map a UK calendar month to its meteorological season.
function getSeason(month: number): GardenSeason {
  // March through May are spring in the northern hemisphere.
  if (month >= 3 && month <= 5) return "spring";
  // June through August are the UK's summer months.
  if (month >= 6 && month <= 8) return "summer";
  // September through November form autumn.
  if (month >= 9 && month <= 11) return "autumn";
  // December, January, and February complete winter.
  return "winter";
}

// Calculate the Sun's horizontal position for the London garden anchor.
function getSolarPosition(instant: Date) {
  // Unix milliseconds convert directly to the astronomical Julian day scale.
  const julianDay = instant.getTime() / 86_400_000 + 2_440_587.5;
  // Most compact solar equations measure days since the J2000 epoch.
  const daysSinceJ2000 = julianDay - 2_451_545;
  // Mean longitude describes the Sun's average annual path.
  const meanLongitude = modulo(280.46 + 0.9856474 * daysSinceJ2000, 360);
  // Mean anomaly supplies the correction for Earth's elliptical orbit.
  const meanAnomaly =
    modulo(357.528 + 0.9856003 * daysSinceJ2000, 360) * DEGREES_TO_RADIANS;
  // Ecliptic longitude applies the two dominant orbital corrections.
  const eclipticLongitude =
    (meanLongitude +
      1.915 * Math.sin(meanAnomaly) +
      0.02 * Math.sin(2 * meanAnomaly)) *
    DEGREES_TO_RADIANS;
  // Earth's slowly changing axial tilt converts the ecliptic into sky coordinates.
  const obliquity = (23.439 - 0.0000004 * daysSinceJ2000) * DEGREES_TO_RADIANS;
  // Right ascension is the Sun's longitude on the celestial equator.
  const rightAscension = modulo(
    Math.atan2(
      Math.cos(obliquity) * Math.sin(eclipticLongitude),
      Math.cos(eclipticLongitude),
    ) * RADIANS_TO_DEGREES,
    360,
  );
  // Declination is the Sun's seasonal distance north or south of that equator.
  const declination = Math.asin(
    Math.sin(obliquity) * Math.sin(eclipticLongitude),
  );
  // Sidereal time rotates celestial coordinates into the observer's local sky.
  const siderealDegrees = modulo(
    280.46061837 + 360.98564736629 * daysSinceJ2000 + LONDON_LONGITUDE,
    360,
  );
  // Hour angle is negative before solar noon and positive after it.
  const hourAngleDegrees =
    modulo(siderealDegrees - rightAscension + 180, 360) - 180;
  const hourAngle = hourAngleDegrees * DEGREES_TO_RADIANS;
  // Latitude completes the conversion from equatorial to horizontal coordinates.
  const latitude = LONDON_LATITUDE * DEGREES_TO_RADIANS;
  // Altitude measures how far the Sun sits above or below the local horizon.
  const altitude = Math.asin(
    Math.sin(latitude) * Math.sin(declination) +
      Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle),
  );
  // Azimuth measures clockwise direction from geographic north.
  const azimuth =
    Math.atan2(
      Math.sin(hourAngle),
      Math.cos(hourAngle) * Math.sin(latitude) -
        Math.tan(declination) * Math.cos(latitude),
    ) + Math.PI;
  // Convert spherical sky coordinates into the garden's Three.js axes.
  const horizontalDistance = Math.cos(altitude) * CELESTIAL_DISTANCE;
  const position: CelestialPosition = [
    Math.sin(azimuth) * horizontalDistance,
    Math.sin(altitude) * CELESTIAL_DISTANCE,
    -Math.cos(azimuth) * horizontalDistance,
  ];
  // Return both presentation coordinates and phase-selection measurements.
  return {
    position,
    elevationDegrees: altitude * RADIANS_TO_DEGREES,
    hourAngleDegrees,
  };
}

// Convert one absolute instant into the complete real-time UK garden state.
export function getUkGardenTime(instant: Date): UkGardenTime {
  // Read civil time separately from astronomical position.
  const uk = getUkParts(instant);
  // Calculate the actual solar path for central London.
  const solar = getSolarPosition(instant);
  // Twilight belongs to morning or evening according to solar hour angle.
  const phase: GardenLightPhase =
    solar.elevationDegrees >= 0
      ? "day"
      : solar.elevationDegrees > -6
        ? solar.hourAngleDegrees < 0
          ? "dawn"
          : "dusk"
        : "night";
  // Translate daylight into a continuous zero-to-one lighting strength.
  const daylight = smoothStep(-6, 9, solar.elevationDegrees);
  // Moonlight rises as sunlight sinks beneath the horizon.
  const moonlight = 1 - smoothStep(-9, 3, solar.elevationDegrees);
  // Dawn is cooler while dusk carries a slightly deeper rose tone.
  const twilightSky = solar.hourAngleDegrees < 0 ? "#b98777" : "#ad625f";
  // Below the horizon, blend night gradually toward the twilight horizon.
  const skyColor =
    solar.elevationDegrees < 0
      ? mixHex(
          "#07111f",
          twilightSky,
          smoothStep(-12, 0, solar.elevationDegrees),
        )
      : mixHex(
          twilightSky,
          "#8fc8e8",
          smoothStep(0, 12, solar.elevationDegrees),
        );
  // Fog follows the same transition with softer, less saturated endpoints.
  const fogColor =
    solar.elevationDegrees < 0
      ? mixHex("#111827", "#b78675", smoothStep(-12, 0, solar.elevationDegrees))
      : mixHex("#b78675", "#b9d8dc", smoothStep(0, 12, solar.elevationDegrees));
  // Daylight warms the sky-facing half of the hemisphere light.
  const hemisphereColor = mixHex("#8fa8c7", "#fff2ca", daylight);
  // Low sun is amber and becomes creamy white as it climbs.
  const sunColor = mixHex(
    "#ff9f68",
    "#fff0c2",
    smoothStep(0, 25, solar.elevationDegrees),
  );
  // The Moon follows the opposite point so it rises as the Sun sets.
  const moonPosition: CelestialPosition = [
    -solar.position[0],
    -solar.position[1],
    -solar.position[2],
  ];
  // Give daylight hours more specific language while preserving twilight phases.
  const periodLabel =
    phase === "day"
      ? uk.hour < 12
        ? "morning"
        : uk.hour < 17
          ? "afternoon"
          : "evening"
      : phase;
  // Return one immutable-by-convention value for every consumer in the scene.
  return {
    isoDateTime: instant.toISOString(),
    timeLabel: [uk.hour, uk.minute, uk.second]
      .map((value) => String(value).padStart(2, "0"))
      .join(":"),
    dateLabel: UK_DATE_FORMATTER.format(instant),
    zoneLabel: uk.zoneLabel,
    season: getSeason(uk.month),
    periodLabel,
    phase,
    sunPosition: solar.position,
    moonPosition,
    sunIntensity: 2.45 * daylight,
    moonIntensity: 0.3 * moonlight,
    hemisphereIntensity: 0.14 + 0.92 * daylight + 0.08 * moonlight,
    environmentIntensity: 0.08 + 0.68 * daylight + 0.06 * moonlight,
    skyColor,
    fogColor,
    hemisphereColor,
    sunColor,
  };
}
