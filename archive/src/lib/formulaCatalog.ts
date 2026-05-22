import type { SimulationIntent } from "./simulationIntent";

export interface FormulaCard {
  label: string;
  equation: string;
  meaning: string;
}

const FORMULAS: Record<SimulationIntent, FormulaCard[]> = {
  newtons_second_law: [
    { label: "Core law", equation: "F = ma", meaning: "Force equals mass times acceleration." },
    {
      label: "Acceleration",
      equation: "a = F / m",
      meaning: "Acceleration grows when force increases or mass falls.",
    },
  ],
  projectile_motion: [
    {
      label: "Vertical motion",
      equation: "s = ut + 1/2 at²",
      meaning: "Vertical displacement under constant acceleration.",
    },
    {
      label: "Velocity",
      equation: "v = u + at",
      meaning: "Velocity changes linearly with time under constant acceleration.",
    },
  ],
  pendulum: [
    {
      label: "Small-angle period",
      equation: "T = 2π√(L/g)",
      meaning: "A pendulum oscillates faster when gravity is stronger or length is shorter.",
    },
    {
      label: "Restoring torque",
      equation: "τ = -mgL sin(θ)",
      meaning: "Gravity creates a restoring torque toward equilibrium.",
    },
  ],
  collision: [
    {
      label: "Momentum",
      equation: "p = mv",
      meaning: "Momentum is the product of mass and velocity.",
    },
    {
      label: "Conservation",
      equation: "Σp_before = Σp_after",
      meaning: "Total momentum stays constant in an isolated system.",
    },
  ],
  gravity_system: [
    {
      label: "Universal gravitation",
      equation: "F = Gm₁m₂ / r²",
      meaning: "Gravitational force weakens with distance squared.",
    },
    {
      label: "Orbital speed",
      equation: "v = √(GM/r)",
      meaning: "Stable orbits require tangential speed set by gravity.",
    },
  ],
  inclined_plane: [
    {
      label: "Parallel acceleration",
      equation: "a = g sin(θ) - μ g cos(θ)",
      meaning: "Acceleration depends on the slope angle and friction.",
    },
    {
      label: "Normal force",
      equation: "N = mg cos(θ)",
      meaning: "The surface supports the component perpendicular to the ramp.",
    },
  ],
  circular_motion: [
    {
      label: "Centripetal acceleration",
      equation: "a_c = v² / r",
      meaning: "Inward acceleration keeps the body on a circle.",
    },
    {
      label: "Angular speed",
      equation: "ω = v / r",
      meaning: "Faster tangential speed increases angular motion.",
    },
  ],
};

export function getFormulaCards(intent: SimulationIntent): FormulaCard[] {
  return FORMULAS[intent];
}

export function getPrimaryFormula(intent: SimulationIntent): string {
  return FORMULAS[intent][0]?.equation ?? "F = ma";
}
