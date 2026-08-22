# The Secret Garden

Project management using **Github Project**: https://github.com/users/sophiaxuz/projects/1/

## 0. Ideation

Recently I read a child fiction _The Secret Garden_, and I got enchanted by the idea of having a digital garden of my own, where I could grow plants / ideas? Maybe I can have a whole ecosystem there.

I'm a very visual person, so i want to have a 3D visual interactive app. (Three.js?)

Every encounter leaves a seed.
What we attend to becomes part of our inner garden.

Book, films, music
Flowers, butterflies, birds, trees..

The garden follows a lifecycle.
Spring -> Summer -> Autumn -> Winter

Grow, harvest and prune (?).

For v1, let's scope it to plants!
Using plant-identification API
pl@ntnet api - free up to 500 requests

it's a bit like picturethis but i really want them to be more visual, rather than looking like a database or a list.

### User experience

**External sensory input:**
Vision: colour, depth, motion, light, AR objects
Sound: birds, rain, spatial audio, directional prompts
Touch: vibration patterns and haptic responses
Movement: camera movement, tilting, walking and reaching
Proprioception: interactions requiring the body to orient or move


flowchart TD
    A["Flower photograph"] --> B["Pl@ntNet identification"]
    B --> C["Species and confidence"]
    A --> D["Extract dominant colours"]
    C --> E["Choose plant archetype"]
    D --> F["Create appearance"]
    E --> F
    F --> G["Render unique 3D flower"]

**Goal-based mechanism**
TODO

**Flower**
User take a photo, it will call pl@ntnet api -> plant a flower (hmmm, how can i get a 3d model version of that flower????)

Create a small library of plant archetypes (3D models):

Daisy-like
Rose-like
Bell-shaped
Spike-shaped
Cup-shaped
Leafy plant


### Tech stack

Frontend:
- next.js  
- Three.js  
- Typescript
- React Three fiber (React renderer for three.js)
- React three drei (helper for react three fiber)

Backend:
- Next.js Route Handlers
- Pl@ntNet identification API
- Supabase Postgres
- Supabase Storage
- Supabase Auth, only when accounts become necessary

3D assets:
- GLB/glTF plant archetypes
- Procedural variation through React Three Fiber