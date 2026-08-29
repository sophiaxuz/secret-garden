# Garden modules

The garden is organised by responsibility so related rendering, data, and tests stay together.

## Runtime architecture

Read this diagram from left to right. It shows how browser input becomes page state, how that state enters the Three.js world, and how a 3D target returns to the HTML interface.

```mermaid
flowchart LR
    Visitor["Visitor<br/>keyboard · pointer · photo"] --> Page["app/page.tsx<br/>route adapter"]
    Page --> Experience["GardenExperience<br/>entry + planting state + HTML controls"]

    Experience -->|start or stop| Audio["NatureSoundscape<br/>Web Audio"]
    Experience -->|entered + plantedCount| Garden["Garden.tsx<br/>3D boundary + inspection state"]

    Garden --> Clock["GardenClock<br/>HTML overlay"]
    Garden --> Canvas["React Three Fiber Canvas<br/>camera + render loop"]
    Provider["Open-Meteo<br/>current London conditions"] --> Route["/api/weather<br/>validated + cached"]
    Route --> Weather["weather/<br/>live hook + rain renderer"]
    Weather --> Clock
    Weather --> Lighting
    Time["UK date and time"] --> Lighting["GardenLighting<br/>sky + Sun/Moon + shadows"]
    Time --> Clock

    Canvas --> Lighting
    Canvas --> Navigation["FirstPersonControls<br/>movement + collision"]
    Canvas --> World["GardenWorld<br/>scene composition"]
    Canvas --> Interaction["GardenInteraction<br/>raycasting + click/tap/E"]

    World --> Terrain["terrain/<br/>island + coast + animated sea"]
    World --> Flora["flora/<br/>flowers + trees"]
    World --> Animals["animals/<br/>models + habitats + motion"]
    Routine["animals/behavior/<br/>variable phases + garden-wide destinations"] --> Animals

    Flora --> Targets["GardenInteractionTarget<br/>small invisible hit volumes"]
    Animals --> Targets
    Targets --> Registry["Interaction registry<br/>inspectable targets only"]
    Interaction -->|raycast| Registry
    Interaction -->|targeted or selected GardenItem| Garden
    Garden --> UI["Prompt + inspection dialog<br/>HTML overlay"]
```

The most important boundaries are:

1. `app/page.tsx` is a small route adapter; `experience/GardenExperience.tsx` owns entering, sound activation, photo selection, and the number of planted flowers.
2. `Garden.tsx` translates that state into a WebGL scene and translates 3D inspection results back into accessible HTML overlays.
3. `GardenWorld.tsx` only composes physical scene modules; each responsibility folder owns its own implementation.
4. Flora and animals register small interaction targets, so raycasting never searches the entire scene.
5. UK time is one shared input for both the visible clock and the garden's celestial lighting.
6. Live weather crosses a server-side validation boundary before it controls clouds, rain, visibility, sunlight, or the clock label.

## Module map

| Module | Owns |
| --- | --- |
| `Garden.tsx` | The public 3D garden interface used by the experience |
| `GardenWorld.tsx` | Composition of terrain, flora, and animals |
| `garden-layout.ts` | Dimensions shared by rendering and movement |
| `animals/` | Animal models, animation, identities, habitats, and variable behavior routines |
| `audio/` | The browser Web Audio soundscape |
| `experience/` | Visit state, entry threshold, atmosphere, and HTML controls |
| `flora/` | Flowers, trees, placement data, and flora composition |
| `interaction/` | Target registration, raycasting, and inspection UI |
| `lighting/` | UK time, Sun, Moon, drifting clouds, and world shadow policy |
| `navigation/` | First-person input, boundaries, and collision |
| `terrain/` | Organic island, sandy coast, animated sea, path, and grass rendering |
| `weather/` | Open-Meteo mapping, resilient client refresh, and instanced rain |

`Garden.tsx` and `GardenWorld.tsx` are composition modules. Feature implementation should remain in the responsibility folder that owns it.

The animal folder follows the same rule internally:

```text
animals/
├── behavior/              shared timing and garden-wide roaming
├── butterfly/             Butterfly component
├── cat/                   Cat behavior and visible model
├── dog/                   Dog behavior and visible model
├── rabbit/                Rabbit behavior and visible model
├── robin/                 Robin, permanent nest, and homecoming behavior
├── squirrel/              Squirrel component, motion seam, and tests
├── animal-habitats.ts     initial world positions
├── animal-identities.ts   names and inspection stories
└── GardenAnimals.tsx      animal scene composition
```

`experience/GardenExperience.tsx` mounts `audio/NatureSoundscape.tsx` directly because browser autoplay rules require its `start()` interface to run inside the threshold click gesture. It remains part of the garden module even though it sits beside, rather than inside, the WebGL canvas.
