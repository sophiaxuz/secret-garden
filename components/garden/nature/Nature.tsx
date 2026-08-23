// React state and effects observe the visitor's reduced-motion preference.
import { useEffect, useState } from "react";
// Group the garden's moving animal life behind one small scene interface.
import { Butterfly } from "./Butterfly";
import { Cat } from "./cat/Cat";
import { Dog } from "./dog/Dog";
import { Rabbit } from "./rabbit/Rabbit";
import { Robin } from "./Robin";
import { Squirrel } from "./Squirrel";
// Every animal's world-space habitat anchors live in one shared map.
import { ANIMAL_HABITATS } from "./animal-habitats";
// Every rendered animal receives one stable inspectable identity from this cast.
import { ANIMAL_IDENTITIES } from "./animal-identities";

// Add several independently animated inhabitants to the garden.
export function Nature({ targetedItemId }: { targetedItemId: string | null }) {
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
        origin={ANIMAL_HABITATS.butterflies.entrance}
        item={ANIMAL_IDENTITIES.butterflies.entrance}
        highlighted={
          targetedItemId === ANIMAL_IDENTITIES.butterflies.entrance.id
        }
      />
      <Butterfly
        animated={animated}
        color="#a9c9df"
        origin={ANIMAL_HABITATS.butterflies.middle}
        phase={2.1}
        item={ANIMAL_IDENTITIES.butterflies.middle}
        highlighted={targetedItemId === ANIMAL_IDENTITIES.butterflies.middle.id}
      />
      <Butterfly
        animated={animated}
        color="#e8a5a1"
        origin={ANIMAL_HABITATS.butterflies.deep}
        phase={4.3}
        item={ANIMAL_IDENTITIES.butterflies.deep}
        highlighted={targetedItemId === ANIMAL_IDENTITIES.butterflies.deep.id}
      />
      {/* The robin waits near the starting path. */}
      <Robin
        animated={animated}
        item={ANIMAL_IDENTITIES.robin}
        highlighted={targetedItemId === ANIMAL_IDENTITIES.robin.id}
      />
      {/* The squirrel stays lower and farther into the garden. */}
      <Squirrel
        animated={animated}
        item={ANIMAL_IDENTITIES.squirrel}
        highlighted={targetedItemId === ANIMAL_IDENTITIES.squirrel.id}
      />
      {/* The rabbit forages among the flowers on the sunny side. */}
      <Rabbit
        animated={animated}
        item={ANIMAL_IDENTITIES.rabbit}
        highlighted={targetedItemId === ANIMAL_IDENTITIES.rabbit.id}
      />
      {/* The dog follows a friendly patrol near the front of the garden. */}
      <Dog
        animated={animated}
        item={ANIMAL_IDENTITIES.dog}
        highlighted={targetedItemId === ANIMAL_IDENTITIES.dog.id}
      />
      {/* The cat quietly watches the deeper, shaded side of the garden. */}
      <Cat
        animated={animated}
        item={ANIMAL_IDENTITIES.cat}
        highlighted={targetedItemId === ANIMAL_IDENTITIES.cat.id}
      />
    </>
  );
}
