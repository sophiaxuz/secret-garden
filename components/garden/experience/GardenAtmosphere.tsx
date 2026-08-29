// Render the static HTML layers that give the garden its analogue atmosphere.
export function GardenAtmosphere() {
  // A fragment groups sibling overlays without adding an unwanted layout element.
  return (
    <>
      {/* These layers add edge shading and analogue-looking texture. */}
      <div className="vignette" />
      <div className="grain" />
      {/* This quiet label names the place while the live clock supplies time. */}
      <div className="garden-name">The Secret Garden</div>
    </>
  );
}
