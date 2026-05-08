from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Iterable


@dataclass(frozen=True)
class SimulationIntent:
    simulation_type: str
    label: str
    subject: str = "physics"
    confidence: float = 0.5
    keywords: tuple[str, ...] = ()


_INTENT_RULES: list[tuple[str, str, tuple[str, ...]]] = [
    (
        "newtons_second_law",
        "Newton's Second Law",
        ("newton", "second law", "net force", "f = ma", "force equals mass times acceleration"),
    ),
    (
        "newtons_third_law",
        "Newton's Third Law",
        ("third law", "action reaction", "equal and opposite"),
    ),
    (
        "newtons_first_law",
        "Newton's First Law",
        ("first law", "inertia", "balanced forces"),
    ),
    (
        "projectile_motion",
        "Projectile Motion",
        ("projectile", "trajectory", "launch angle", "range", "time of flight"),
    ),
    (
        "pendulum",
        "Pendulum Oscillation",
        ("pendulum", "oscillation", "swing", "period", "simple harmonic"),
    ),
    (
        "collision",
        "Momentum Conservation",
        ("momentum", "collision", "elastic", "inelastic", "impulse"),
    ),
    (
        "gravity_system",
        "Gravity System",
        ("gravity", "orbit", "orbital", "satellite", "planet", "gravitational"),
    ),
    (
        "inclined_plane",
        "Inclined Plane",
        ("inclined plane", "ramp", "slope", "incline", "angle of incline"),
    ),
    (
        "circular_motion",
        "Circular Motion",
        ("circular motion", "centripetal", "angular velocity", "orbiting"),
    ),
]


def _match_score(prompt: str, keywords: Iterable[str]) -> float:
    score = 0.0
    for keyword in keywords:
        if keyword in prompt:
            score += 1.0
    return score


def detect_simulation_intent(prompt: str) -> SimulationIntent:
    """
    Classify a natural language prompt into a reusable simulation intent.

    The detector prefers deterministic keyword matching so the downstream DSL
    generator and renderer always agree on the simulation family.
    """

    lowered = re.sub(r"\s+", " ", prompt.lower()).strip()

    best_type = "newtons_second_law"
    best_label = "Newton's Second Law"
    best_score = 0.0
    best_keywords: tuple[str, ...] = ()

    for simulation_type, label, keywords in _INTENT_RULES:
        score = _match_score(lowered, keywords)
        if score > best_score:
            best_type = simulation_type
            best_label = label
            best_score = score
            best_keywords = keywords

    if best_score == 0:
        if any(term in lowered for term in ("motion", "force", "acceleration", "velocity")):
            best_type = "newtons_second_law"
            best_label = "Newton's Second Law"
            best_score = 0.6
        elif any(term in lowered for term in ("orbit", "planet", "gravity")):
            best_type = "gravity_system"
            best_label = "Gravity System"
            best_score = 0.6

    return SimulationIntent(
        simulation_type=best_type,
        label=best_label,
        confidence=min(1.0, max(0.5, best_score / 4.0 if best_score else 0.5)),
        keywords=best_keywords,
    )
