// React state and effects observe the visitor's reduced-motion preference.
import { useEffect, useState } from "react";
// Group the garden's moving animal life behind one small scene interface.
import { Butterfly } from "./butterfly/Butterfly";
import { Cat } from "./cat/Cat";
import { Dog } from "./dog/Dog";
import { Rabbit } from "./rabbit/Rabbit";
import { Robin } from "./robin/Robin";
import { Squirrel } from "./squirrel/Squirrel";
// Every animal's world-space habitat anchors live in one shared map.
import { ANIMAL_HABITATS } from "./animal-habitats";
// Every rendered animal receives one stable inspectable identity from this cast.
import {
  ANIMAL_IDENTITIES,
  type AnimatedAnimalProps,
} from "./animal-identities";
// One shared time rule prevents species from disagreeing about nightfall.
import { getAnimalActivity } from "./behavior/animal-sleep";
// The lighting phase is the smallest time value needed by animal behaviour.
import type { GardenLightPhase } from "../lighting/uk-garden-time";

// Pair an identity with the targeting state derived from its own id.
function interactionPropsFor(
  item: AnimatedAnimalProps["item"],
  targetedItemId: string | null,
): Pick<AnimatedAnimalProps, "item" | "highlighted"> {
  // Returning both values together prevents mismatched identity comparisons.
  return { item, highlighted: targetedItemId === item.id };
}

// Add several independently animated inhabitants to the garden.
export function GardenAnimals({
  targetedItemId,
  lightPhase,
}: {
  // The matching inhabitant glows when the visitor aims at its hit volume.
  targetedItemId: string | null;
  // The UK astronomical phase synchronizes the cast's daily rhythm.
  lightPhase: GardenLightPhase;
}) {
  // Start conservatively until the browser preference has been read.
  const [animated, setAnimated] = useState(false);
  // Derive one stable scene-wide signal rather than repeating time logic per species.
  const sleeping = getAnimalActivity(lightPhase) === "sleeping";

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
        sleeping={sleeping}
        color="#f0c95a"
        origin={ANIMAL_HABITATS.butterflies.entrance}
        {...interactionPropsFor(
          ANIMAL_IDENTITIES.butterflies.entrance,
          targetedItemId,
        )}
      />
      <Butterfly
        animated={animated}
        sleeping={sleeping}
        color="#a9c9df"
        origin={ANIMAL_HABITATS.butterflies.middle}
        phase={2.1}
        {...interactionPropsFor(
          ANIMAL_IDENTITIES.butterflies.middle,
          targetedItemId,
        )}
      />
      <Butterfly
        animated={animated}
        sleeping={sleeping}
        color="#e8a5a1"
        origin={ANIMAL_HABITATS.butterflies.deep}
        phase={4.3}
        {...interactionPropsFor(
          ANIMAL_IDENTITIES.butterflies.deep,
          targetedItemId,
        )}
      />
      {/* The robin begins in the meadow before roaming between tree branches. */}
      <Robin
        animated={animated}
        sleeping={sleeping}
        {...interactionPropsFor(ANIMAL_IDENTITIES.robin, targetedItemId)}
      />
      {/* The squirrel links changing foraging patches through its tree climb. */}
      <Squirrel
        animated={animated}
        sleeping={sleeping}
        {...interactionPropsFor(ANIMAL_IDENTITIES.squirrel, targetedItemId)}
      />
      {/* The rabbit begins sunny-side foraging before ranging more widely. */}
      <Rabbit
        animated={animated}
        sleeping={sleeping}
        {...interactionPropsFor(ANIMAL_IDENTITIES.rabbit, targetedItemId)}
      />
      {/* The dog starts near the entrance, then wanders throughout the garden. */}
      <Dog
        animated={animated}
        sleeping={sleeping}
        {...interactionPropsFor(ANIMAL_IDENTITIES.dog, targetedItemId)}
      />
      {/* The cat starts in deep shade before choosing its own roaming route. */}
      <Cat
        animated={animated}
        sleeping={sleeping}
        {...interactionPropsFor(ANIMAL_IDENTITIES.cat, targetedItemId)}
      />
    </>
  );
}
