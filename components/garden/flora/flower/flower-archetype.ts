// Open flower families share rendering topology but retain authored botanical traits.
export type FlowerPetalProfile =
  "daisy" | "rose" | "buttercup" | "cosmos" | "meadow";

// One deep style record owns geometry, surface, and reproductive-part decisions.
export type FlowerArchetypeStyle = {
  petal: {
    width: number;
    length: number;
    cup: number;
    ruffle: number;
    notch: number;
  };
  centre: {
    radius: number;
    color: string;
    stamens: number;
    arrangement: "ring" | "disc";
  };
  surface: {
    roughness: number;
    sheen: number;
    clearcoat: number;
    transmission: number;
  };
};

// Adding an open archetype now changes one cohesive botanical catalogue entry.
export const FLOWER_ARCHETYPE_STYLES: Record<
  FlowerPetalProfile,
  FlowerArchetypeStyle
> = {
  daisy: {
    petal: { width: 0.72, length: 1.08, cup: 0.58, ruffle: 0.08, notch: 0.05 },
    centre: {
      radius: 0.072,
      color: "#c99a32",
      stamens: 28,
      arrangement: "disc",
    },
    surface: {
      roughness: 0.68,
      sheen: 0.2,
      clearcoat: 0.02,
      transmission: 0.018,
    },
  },
  rose: {
    petal: { width: 1.24, length: 0.82, cup: 1.42, ruffle: 0.2, notch: 0.13 },
    centre: {
      radius: 0.055,
      color: "#b88c36",
      stamens: 19,
      arrangement: "ring",
    },
    surface: {
      roughness: 0.6,
      sheen: 0.44,
      clearcoat: 0.035,
      transmission: 0.024,
    },
  },
  buttercup: {
    petal: { width: 1.05, length: 0.84, cup: 0.95, ruffle: 0.05, notch: 0.01 },
    centre: {
      radius: 0.06,
      color: "#9c8630",
      stamens: 17,
      arrangement: "disc",
    },
    surface: {
      roughness: 0.46,
      sheen: 0.27,
      clearcoat: 0.16,
      transmission: 0.014,
    },
  },
  cosmos: {
    petal: { width: 1.08, length: 1.04, cup: 0.66, ruffle: 0.26, notch: 0.2 },
    centre: {
      radius: 0.07,
      color: "#b8862c",
      stamens: 24,
      arrangement: "disc",
    },
    surface: {
      roughness: 0.64,
      sheen: 0.38,
      clearcoat: 0.025,
      transmission: 0.03,
    },
  },
  meadow: {
    petal: { width: 0.92, length: 0.96, cup: 0.78, ruffle: 0.12, notch: 0.07 },
    centre: {
      radius: 0.067,
      color: "#c99a32",
      stamens: 18,
      arrangement: "disc",
    },
    surface: {
      roughness: 0.64,
      sheen: 0.25,
      clearcoat: 0.03,
      transmission: 0.02,
    },
  },
};

// Bell is structurally distinct; every other archetype maps directly to a profile.
export type FlowerArchetype = FlowerPetalProfile | "bell";
