// React state and effects observe the visitor's reduced-motion preference.
import { useEffect, useState } from "react";
// Group the garden's moving animal life behind one small scene interface.
import { Butterfly } from "./Butterfly";
import { Cat } from "./cat/Cat";
import { Dog } from "./dog/Dog";
import { Rabbit } from "./rabbit/Rabbit";
import { Robin } from "./Robin";
import { Squirrel } from "./Squirrel";

// Add several independently animated inhabitants to the garden.
export function Nature() {
  // Start conservatively until the browser preference has been read.
  const [animated, setAnimated] = useState(false);

  // Keep animal motion synchronized with live operating-system preference changes.
  useEffect(() => {
    // This media query is the JavaScript equivalent of the CSS motion query.
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Motion is allowed only when the visitor has not requested reduction.
    const update = () => setAnimated(!preference.matches);
    // Read the initial value and then subscribe to future changes.
    update();
    preference.addEventListener("change", update);
    // Remove the listener when the scene unmounts.
    return () => preference.removeEventListener("change", update);
  }, []);

  // A fragment avoids adding an unnecessary transform group.
  return (
    <>
      {/* Different origins, phases, and colors prevent synchronized movement. */}
      <Butterfly
        animated={animated}
        color="#f0c95a"
        origin={[-1.6, 1.25, 2.4]}
      />
      <Butterfly
        animated={animated}
        color="#a9c9df"
        origin={[2.2, 1.55, -0.5]}
        phase={2.1}
      />
      <Butterfly
        animated={animated}
        color="#e8a5a1"
        origin={[-2.8, 1.1, -3.2]}
        phase={4.3}
      />
      {/* The robin waits near the starting path. */}
      <Robin animated={animated} />
      {/* The squirrel stays lower and farther into the garden. */}
      <Squirrel animated={animated} />
      {/* The rabbit forages among the flowers on the sunny side. */}
      <Rabbit animated={animated} />
      {/* The dog follows a friendly patrol near the front of the garden. */}
      <Dog animated={animated} />
      {/* The cat quietly watches the deeper, shaded side of the garden. */}
      <Cat animated={animated} />
    </>
  );
}
