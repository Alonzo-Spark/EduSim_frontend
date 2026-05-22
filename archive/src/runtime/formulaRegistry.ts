type FormulaEntry = {
  formula: string;
  formulas: string[];
  explanation: string;
  concepts: string[];
};

const FORMULA_REGISTRY: Record<string, FormulaEntry> = {
  newtons_first_law: {
    formula: "ΣF = 0 ⟹ a = 0",
    formulas: ["ΣF = 0 ⟹ a = 0"],
    explanation: "Objects maintain constant velocity unless acted on by a net external force.",
    concepts: ["inertia", "balanced forces", "equilibrium"],
  },
  newtons_second_law: {
    formula: "F = ma",
    formulas: ["F = ma", "a = F_net / m"],
    explanation: "Net force determines acceleration and mass resists that acceleration.",
    concepts: ["force", "mass", "acceleration"],
  },
  newtons_third_law: {
    formula: "F_AB = -F_BA",
    formulas: ["F_AB = -F_BA"],
    explanation: "For every action force there is an equal and opposite reaction force.",
    concepts: ["action-reaction", "interaction pairs", "force"],
  },
  projectile_motion: {
    formula: "s = ut + 1/2 at²",
    formulas: ["x = u cos(θ) t", "y = u sin(θ) t - 1/2 g t²", "s = ut + 1/2 at²"],
    explanation:
      "Projectile motion separates into horizontal and vertical motion under constant gravity.",
    concepts: ["trajectory", "range", "launch angle", "gravity"],
  },
  pendulum: {
    formula: "T = 2π√(L/g)",
    formulas: ["T = 2π√(L/g)", "θ'' + (g/L) sin(θ) = 0"],
    explanation:
      "A pendulum oscillates due to gravity and its period depends on length and gravitational field.",
    concepts: ["oscillation", "period", "length", "gravity"],
  },
  collision: {
    formula: "p = mv",
    formulas: ["p = mv", "Σp_before = Σp_after"],
    explanation: "Momentum is conserved in isolated collisions and impulse changes momentum.",
    concepts: ["momentum", "impulse", "elastic", "inelastic"],
  },
  gravity_system: {
    formula: "F = Gm₁m₂ / r²",
    formulas: ["F = Gm₁m₂ / r²"],
    explanation:
      "Bodies attract with gravitational force that falls off with the square of distance.",
    concepts: ["orbit", "gravity", "satellite", "planet"],
  },
  inclined_plane: {
    formula: "a = g(sinθ - μ cosθ)",
    formulas: ["F_parallel = mg sinθ", "F_normal = mg cosθ", "a = g(sinθ - μ cosθ)"],
    explanation:
      "On an incline, forces resolve into parallel and normal components with friction opposing motion.",
    concepts: ["incline", "friction", "normal force", "components"],
  },
  circular_motion: {
    formula: "F_c = mv² / r",
    formulas: ["F_c = mv² / r", "a_c = v² / r"],
    explanation:
      "Circular motion requires inward centripetal force to keep an object on a curved path.",
    concepts: ["centripetal force", "radius", "angular velocity"],
  },
};

export function getFormulaEntry(simulationType: string): FormulaEntry {
  return FORMULA_REGISTRY[simulationType] || FORMULA_REGISTRY.newtons_second_law;
}
