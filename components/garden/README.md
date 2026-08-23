# Garden modules

The garden is organised by responsibility so related rendering, data, and tests stay together.

| Module | Owns |
| --- | --- |
| `Garden.tsx` | The public 3D garden interface used by the page |
| `GardenWorld.tsx` | Composition of terrain, flora, and animals |
| `garden-layout.ts` | Dimensions shared by rendering and movement |
| `animals/` | Animal models, animation, identities, and habitats |
| `audio/` | The browser Web Audio soundscape |
| `flora/` | Flowers, trees, placement data, and flora composition |
| `interaction/` | Target registration, raycasting, and inspection UI |
| `lighting/` | UK time, Sun, Moon, drifting clouds, and world shadow policy |
| `navigation/` | First-person input, boundaries, and collision |
| `terrain/` | Ground, path, grass rendering, and grass geometry |

`Garden.tsx` and `GardenWorld.tsx` are composition modules. Feature implementation should remain in the responsibility folder that owns it.

The page mounts `audio/NatureSoundscape.tsx` directly because browser autoplay rules require its `start()` interface to run inside the threshold click gesture. It remains part of the garden module even though it sits beside, rather than inside, the WebGL canvas.
