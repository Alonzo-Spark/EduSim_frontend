from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class FormulaBundle:
    simulation_type: str
    label: str
    primary_formula: str
    formulas: tuple[str, ...]
    explanation: str
    concepts: tuple[str, ...]


_FORMULA_REGISTRY: dict[str, FormulaBundle] = {
    "newtons_first_law": FormulaBundle(
        simulation_type="newtons_first_law",
        label="Newton's First Law",
        primary_formula="ΣF = 0 ⟹ a = 0",
        formulas=("ΣF = 0 ⟹ a = 0",),
        explanation="An object remains at rest or moves with constant velocity when the net force is zero.",
        concepts=("inertia", "balanced forces", "equilibrium"),
    ),
    "newtons_second_law": FormulaBundle(
        simulation_type="newtons_second_law",
        label="Newton's Second Law",
        primary_formula="F = ma",
        formulas=("F = ma", "a = F_net / m"),
        explanation="Net force produces acceleration proportional to force and inversely proportional to mass.",
        concepts=("force", "mass", "acceleration"),
    ),
    "newtons_third_law": FormulaBundle(
        simulation_type="newtons_third_law",
        label="Newton's Third Law",
        primary_formula="F_AB = -F_BA",
        formulas=("F_AB = -F_BA",),
        explanation="Every action force has an equal and opposite reaction force.",
        concepts=("action-reaction", "interaction pairs", "forces"),
    ),
    "projectile_motion": FormulaBundle(
        simulation_type="projectile_motion",
        label="Projectile Motion",
        primary_formula="s = ut + 1/2 at²",
        formulas=(
            "x = u cos(θ) t",
            "y = u sin(θ) t - 1/2 g t²",
            "s = ut + 1/2 at²",
            "R = u² sin(2θ) / g",
        ),
        explanation="Projectile motion decomposes into independent horizontal and vertical motion under constant gravity.",
        concepts=("trajectory", "launch angle", "range", "gravity"),
    ),
    "pendulum": FormulaBundle(
        simulation_type="pendulum",
        label="Pendulum Oscillation",
        primary_formula="T = 2π√(L/g)",
        formulas=("T = 2π√(L/g)", "θ'' + (g/L) sin(θ) = 0"),
        explanation="A pendulum exchanges gravitational potential and kinetic energy as it oscillates about equilibrium.",
        concepts=("oscillation", "period", "length", "gravity"),
    ),
    "collision": FormulaBundle(
        simulation_type="collision",
        label="Momentum Conservation",
        primary_formula="p = mv",
        formulas=("p = mv", "Σp_before = Σp_after"),
        explanation="Total momentum remains conserved in an isolated collision system.",
        concepts=("momentum", "impulse", "elastic", "inelastic"),
    ),
    "gravity_system": FormulaBundle(
        simulation_type="gravity_system",
        label="Gravity System",
        primary_formula="F = Gm₁m₂ / r²",
        formulas=("F = Gm₁m₂ / r²",),
        explanation="Bodies attract each other with gravitational force that decreases with the square of distance.",
        concepts=("orbital motion", "gravity", "satellite", "planet"),
    ),
    "inclined_plane": FormulaBundle(
        simulation_type="inclined_plane",
        label="Inclined Plane",
        primary_formula="a = g(sinθ - μ cosθ)",
        formulas=("F_parallel = mg sinθ", "F_normal = mg cosθ", "a = g(sinθ - μ cosθ)"),
        explanation="Forces on an incline resolve into parallel and normal components with friction opposing motion.",
        concepts=("incline", "normal force", "friction", "components"),
    ),
    "circular_motion": FormulaBundle(
        simulation_type="circular_motion",
        label="Circular Motion",
        primary_formula="F_c = mv² / r",
        formulas=("F_c = mv² / r", "a_c = v² / r"),
        explanation="Circular motion requires inward centripetal force to keep an object on its path.",
        concepts=("radius", "centripetal force", "angular velocity"),
    ),
}


def get_formula_bundle(simulation_type: str) -> FormulaBundle:
    return _FORMULA_REGISTRY.get(
        simulation_type,
        _FORMULA_REGISTRY["newtons_second_law"],
    )
