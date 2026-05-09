export type SimulationIntent =
  | "newtons_second_law"
  | "projectile_motion"
  | "pendulum"
  | "collision"
  | "gravity_system"
  | "inclined_plane"
  | "circular_motion";

const INTENT_RULES: Array<{ intent: SimulationIntent; keywords: string[] }> = [
  {
    intent: "newtons_second_law",
    keywords: ["newton", "force", "ma", "second law", "f = ma", "acceleration"],
  },
  {
    intent: "projectile_motion",
    keywords: ["projectile", "trajectory", "launch", "range", "45 degree", "45°"],
  },
  { intent: "pendulum", keywords: ["pendulum", "oscillation", "oscillate", "swing", "bob"] },
  {
    intent: "collision",
    keywords: ["collision", "momentum", "elastic", "inelastic", "conservation"],
  },
  {
    intent: "gravity_system",
    keywords: ["gravity", "orbit", "planet", "solar system", "satellite", "planetary"],
  },
  {
    intent: "inclined_plane",
    keywords: ["inclined", "incline", "ramp", "slope", "friction plane"],
  },
  {
    intent: "circular_motion",
    keywords: ["circular", "centripetal", "rotation", "orbiting", "spinning", "tangential"],
  },
];

export function detectSimulationIntent(prompt: string): SimulationIntent {
  const normalized = prompt.trim().toLowerCase();

  for (const rule of INTENT_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.intent;
    }
  }

  return "newtons_second_law";
}

export function humanizeIntent(intent: SimulationIntent): string {
  switch (intent) {
    case "newtons_second_law":
      return "Newton's Second Law";
    case "projectile_motion":
      return "Projectile Motion";
    case "pendulum":
      return "Pendulum Oscillation";
    case "collision":
      return "Momentum Conservation";
    case "gravity_system":
      return "Gravity System";
    case "inclined_plane":
      return "Inclined Plane";
    case "circular_motion":
      return "Circular Motion";
  }
}
