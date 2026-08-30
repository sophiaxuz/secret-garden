// Vitest expresses the botanical promises kept by each whole-plant silhouette.
import { describe, expect, it } from "vitest";
// The pure structure map is the seam between species knowledge and Three rendering.
import { FLOWER_PLANT_STRUCTURES } from "./flower-plant-structure";

// These checks prevent future visual refactors from turning every species into one stem.
describe("FLOWER_PLANT_STRUCTURES", () => {
  // A British bluebell reads through a one-sided raceme above basal strap leaves.
  it("models a bluebell as a multi-bloom raceme with basal leaves", () => {
    // Read the authored bell silhouette without mounting a WebGL scene.
    const bluebell = FLOWER_PLANT_STRUCTURES.bell;

    // Several hanging bells create the characteristic woodland flower spike.
    expect(bluebell.blooms).toHaveLength(6);
    // Strap leaves should emerge from the base rather than float up the stem.
    expect(bluebell.foliage).toBe("basal-straps");
  });

  // A dog rose must not share the same two almond leaves as a daisy.
  it("models a wild rose with branching and compound serrated foliage", () => {
    // Read the rose-specific architecture used by its renderer.
    const rose = FLOWER_PLANT_STRUCTURES.rose;

    // Two side branches break the single-stem assembled-toy silhouette.
    expect(rose.branches.length).toBeGreaterThanOrEqual(2);
    // Compound foliage selects several toothed leaflets along a shared rachis.
    expect(rose.foliage).toBe("compound-serrated");
  });

  // Meadow flowers stay inexpensive while retaining a credible herbaceous form.
  it("keeps ordinary open flowers light but botanically varied", () => {
    // Cosmos has fine divided foliage distinct from daisies and buttercups.
    expect(FLOWER_PLANT_STRUCTURES.cosmos.foliage).toBe("feathery");
    // Buttercup foliage is lobed rather than another almond blade.
    expect(FLOWER_PLANT_STRUCTURES.buttercup.foliage).toBe("lobed");
    // Daisy foliage remains a slim toothed blade appropriate to a meadow stem.
    expect(FLOWER_PLANT_STRUCTURES.daisy.foliage).toBe("toothed-blade");
  });
});
