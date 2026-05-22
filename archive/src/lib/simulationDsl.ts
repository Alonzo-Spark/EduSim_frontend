import { detectSimulationIntent, type SimulationIntent } from "./simulationIntent";
import { getFormulaCards, getPrimaryFormula } from "./formulaCatalog";

export type Vector2 = [number, number];

export interface SimulationControlSpec {
  key: "mass" | "force" | "gravity" | "angle" | "velocity" | "length" | "restitution";
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit: string;
}

export interface SimulationObjectDsl {
  id: string;
  shape: "circle" | "rect" | "pendulum_bob" | "plane" | "arrow" | "orbiter" | "slider";
  position: Vector2;
  velocity: Vector2;
  mass?: number;
  radius?: number;
  size?: [number, number];
  angle?: number;
  angularVelocity?: number;
  anchor?: Vector2;
  length?: number;
  fixed?: boolean;
  color?: string;
  label?: string;
  trail?: boolean;
}

export interface SimulationForceDsl {
  type: "gravity" | "applied_force" | "drag" | "spring" | "centripetal" | "friction";
  target?: string;
  value?: Vector2;
  magnitude?: number;
  angle?: number;
  anchor?: Vector2;
  stiffness?: number;
}

export interface SimulationConstraintDsl {
  type: "hinge" | "distance" | "plane" | "fixed";
  bodyId?: string;
  targetId?: string;
  anchor?: Vector2;
  length?: number;
  angle?: number;
  restitution?: number;
}

export interface SimulationDsl {
  simulation: SimulationIntent;
  prompt: string;
  title: string;
  world: {
    width: number;
    height: number;
    gravity: number;
    friction: number;
    airResistance: number;
    background: "space" | "lab" | "earth" | "road" | "ice" | "mountain";
    timeScale: number;
  };
  objects: SimulationObjectDsl[];
  forces: SimulationForceDsl[];
  constraints: SimulationConstraintDsl[];
  controls: SimulationControlSpec[];
  formula: string;
  formulas: Array<{ label: string; equation: string; meaning: string }>;
  educationalContext: string[];
  notes: string[];
}

const DEFAULT_SIZE = { width: 960, height: 560 };

function titleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (part) => part.toUpperCase())
    .trim();
}

function buildDefaultObjects(intent: SimulationIntent): SimulationObjectDsl[] {
  switch (intent) {
    case "newtons_second_law":
      return [
        {
          id: "block-1",
          shape: "rect",
          position: [180, 360],
          velocity: [0, 0],
          mass: 5,
          size: [90, 54],
          color: "#7c3aed",
          label: "m",
          trail: true,
        },
      ];
    case "projectile_motion":
      return [
        {
          id: "projectile-1",
          shape: "circle",
          position: [120, 420],
          velocity: [220, -180],
          mass: 1,
          radius: 14,
          color: "#38bdf8",
          label: "projectile",
          trail: true,
        },
      ];
    case "pendulum":
      return [
        {
          id: "bob-1",
          shape: "pendulum_bob",
          position: [380, 190],
          velocity: [0, 0],
          mass: 2,
          radius: 20,
          anchor: [380, 80],
          length: 180,
          color: "#f59e0b",
          trail: true,
        },
      ];
    case "collision":
      return [
        {
          id: "ball-a",
          shape: "circle",
          position: [220, 330],
          velocity: [120, 0],
          mass: 2,
          radius: 22,
          color: "#22c55e",
          label: "m1",
        },
        {
          id: "ball-b",
          shape: "circle",
          position: [620, 330],
          velocity: [-30, 0],
          mass: 4,
          radius: 30,
          color: "#ef4444",
          label: "m2",
        },
      ];
    case "gravity_system":
      return [
        {
          id: "star",
          shape: "circle",
          position: [480, 280],
          velocity: [0, 0],
          mass: 2500,
          radius: 28,
          color: "#facc15",
          label: "star",
          fixed: true,
        },
        {
          id: "planet",
          shape: "orbiter",
          position: [690, 280],
          velocity: [0, -112],
          mass: 10,
          radius: 14,
          color: "#38bdf8",
          label: "planet",
          trail: true,
        },
      ];
    case "inclined_plane":
      return [
        {
          id: "ramp",
          shape: "plane",
          position: [330, 420],
          velocity: [0, 0],
          fixed: true,
          size: [300, 20],
          angle: -0.45,
          color: "#64748b",
          label: "ramp",
        },
        {
          id: "cart",
          shape: "rect",
          position: [360, 320],
          velocity: [0, 0],
          mass: 3,
          size: [56, 36],
          color: "#a855f7",
          label: "cart",
          trail: true,
        },
      ];
    case "circular_motion":
      return [
        {
          id: "pivot",
          shape: "circle",
          position: [480, 280],
          velocity: [0, 0],
          mass: 1000,
          radius: 10,
          color: "#94a3b8",
          fixed: true,
          label: "pivot",
        },
        {
          id: "orbiter",
          shape: "orbiter",
          position: [580, 280],
          velocity: [0, -170],
          mass: 3,
          radius: 16,
          color: "#22d3ee",
          label: "orbiter",
          trail: true,
          anchor: [480, 280],
          length: 100,
        },
      ];
  }
}

function buildDefaultControls(intent: SimulationIntent): SimulationControlSpec[] {
  const controls: SimulationControlSpec[] = [
    { key: "gravity", label: "Gravity", min: 0, max: 20, step: 0.1, value: 9.8, unit: "m/s²" },
  ];

  switch (intent) {
    case "newtons_second_law":
      controls.push({
        key: "force",
        label: "Force",
        min: 0,
        max: 40,
        step: 0.5,
        value: 20,
        unit: "N",
      });
      controls.push({
        key: "mass",
        label: "Mass",
        min: 1,
        max: 15,
        step: 0.5,
        value: 5,
        unit: "kg",
      });
      break;
    case "projectile_motion":
      controls.push({
        key: "angle",
        label: "Launch angle",
        min: 10,
        max: 80,
        step: 1,
        value: 45,
        unit: "°",
      });
      controls.push({
        key: "velocity",
        label: "Launch speed",
        min: 5,
        max: 40,
        step: 1,
        value: 28,
        unit: "m/s",
      });
      break;
    case "pendulum":
      controls.push({
        key: "length",
        label: "Length",
        min: 80,
        max: 260,
        step: 5,
        value: 180,
        unit: "px",
      });
      controls.push({
        key: "angle",
        label: "Release angle",
        min: 5,
        max: 50,
        step: 1,
        value: 18,
        unit: "°",
      });
      break;
    case "collision":
      controls.push({
        key: "restitution",
        label: "Restitution",
        min: 0,
        max: 1,
        step: 0.05,
        value: 0.92,
        unit: "",
      });
      break;
    case "gravity_system":
      controls.push({
        key: "velocity",
        label: "Orbital speed",
        min: 60,
        max: 200,
        step: 2,
        value: 112,
        unit: "px/s",
      });
      break;
    case "inclined_plane":
      controls.push({
        key: "angle",
        label: "Ramp angle",
        min: 10,
        max: 55,
        step: 1,
        value: 26,
        unit: "°",
      });
      controls.push({
        key: "mass",
        label: "Mass",
        min: 1,
        max: 15,
        step: 0.5,
        value: 3,
        unit: "kg",
      });
      break;
    case "circular_motion":
      controls.push({
        key: "velocity",
        label: "Tangential speed",
        min: 40,
        max: 260,
        step: 2,
        value: 170,
        unit: "px/s",
      });
      controls.push({
        key: "length",
        label: "Radius",
        min: 60,
        max: 180,
        step: 2,
        value: 100,
        unit: "px",
      });
      break;
  }

  return controls;
}

export function createSimulationDsl(
  prompt: string,
  intent = detectSimulationIntent(prompt),
): SimulationDsl {
  const formulas = getFormulaCards(intent);

  return {
    simulation: intent,
    prompt,
    title: titleCase(intent),
    world: {
      ...DEFAULT_SIZE,
      gravity: 9.8,
      friction: 0.04,
      airResistance: 0.01,
      background:
        intent === "gravity_system" ? "space" : intent === "inclined_plane" ? "mountain" : "lab",
      timeScale: 1,
    },
    objects: buildDefaultObjects(intent),
    forces: [],
    constraints: [],
    controls: buildDefaultControls(intent),
    formula: getPrimaryFormula(intent),
    formulas,
    educationalContext: [
      `${titleCase(intent)} converts user intent into a reusable physics world.`,
      "The runtime updates position, velocity, forces, and constraints in real time.",
    ],
    notes: [
      "This DSL contains no rendering logic.",
      "All visuals are interpreted by the live runtime.",
    ],
  };
}

export function normalizeSimulationDsl(raw: unknown, prompt = ""): SimulationDsl | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const candidate = raw as Record<string, any>;
  if (typeof candidate.simulation === "string" && Array.isArray(candidate.objects)) {
    return candidate as SimulationDsl;
  }

  if (typeof candidate.simulation_type === "string") {
    const legacyIntent = mapLegacyIntent(candidate.simulation_type, prompt);
    const base = createSimulationDsl(prompt || candidate.topic || legacyIntent, legacyIntent);
    const env = candidate.environment || {};

    const objects = Array.isArray(candidate.entities)
      ? candidate.entities.map((entity: any, index: number) => legacyEntityToObject(entity, index))
      : base.objects;

    const forces = Array.isArray(candidate.interactions)
      ? candidate.interactions.map((interaction: any) => legacyInteractionToForce(interaction))
      : [];

    return {
      ...base,
      simulation: legacyIntent,
      title: candidate.topic ? titleCase(String(candidate.topic)) : base.title,
      world: {
        ...base.world,
        gravity: Number(env.gravity ?? base.world.gravity),
        friction: Number(env.friction ?? base.world.friction),
        airResistance: Number(env.air_resistance ?? base.world.airResistance),
      },
      objects,
      forces,
      formula:
        Array.isArray(candidate.equations) && candidate.equations[0]
          ? String(candidate.equations[0])
          : base.formula,
      formulas: base.formulas,
    };
  }

  return null;
}

function mapLegacyIntent(simulationType: string, prompt: string): SimulationIntent {
  const lowered = `${simulationType} ${prompt}`.toLowerCase();
  if (lowered.includes("projectile")) return "projectile_motion";
  if (lowered.includes("pendulum")) return "pendulum";
  if (lowered.includes("momentum") || lowered.includes("collision")) return "collision";
  if (lowered.includes("orbit") || lowered.includes("gravity") || lowered.includes("planet"))
    return "gravity_system";
  if (lowered.includes("incline")) return "inclined_plane";
  if (lowered.includes("circle")) return "circular_motion";
  return "newtons_second_law";
}

function legacyEntityToObject(entity: any, index: number): SimulationObjectDsl {
  const type = String(entity?.type || "circle").toLowerCase();
  const properties = entity?.properties || {};
  const position = Array.isArray(properties.position)
    ? properties.position
    : [140 + index * 90, 320];
  const velocity = Array.isArray(properties.velocity) ? properties.velocity : [0, 0];

  return {
    id: String(entity?.id || `entity-${index}`),
    shape: type.includes("plane")
      ? "plane"
      : type.includes("pendulum")
        ? "pendulum_bob"
        : type.includes("block")
          ? "rect"
          : type.includes("projectile")
            ? "circle"
            : "circle",
    position: [Number(position[0] || 0), Number(position[1] || 0)],
    velocity: [Number(velocity[0] || 0), Number(velocity[1] || 0)],
    mass: entity?.mass ?? properties.mass ?? 1,
    radius: Number(properties.radius ?? 14),
    size: Array.isArray(properties.size)
      ? [Number(properties.size[0] || 48), Number(properties.size[1] || 48)]
      : undefined,
    angle: typeof properties.angle === "number" ? properties.angle : undefined,
    angularVelocity:
      typeof properties.angularVelocity === "number" ? properties.angularVelocity : undefined,
    anchor: Array.isArray(properties.anchor)
      ? [Number(properties.anchor[0] || 0), Number(properties.anchor[1] || 0)]
      : undefined,
    length: typeof properties.length === "number" ? properties.length : undefined,
    fixed: Boolean(properties.fixed),
    color: typeof properties.color === "string" ? properties.color : undefined,
    label: typeof properties.label === "string" ? properties.label : undefined,
    trail: Boolean(properties.trail),
  };
}

function legacyInteractionToForce(interaction: any): SimulationForceDsl {
  const type = String(interaction?.type || "gravity");
  const params = interaction?.parameters || {};

  if (type === "apply_force") {
    return {
      type: "applied_force",
      target: interaction?.target,
      value: Array.isArray(params.force)
        ? [Number(params.force[0] || 0), Number(params.force[1] || 0)]
        : [0, 0],
    };
  }

  if (type === "projectile_launch") {
    return {
      type: "applied_force",
      target: interaction?.target,
      magnitude: Number(params.initial_speed || 0),
      angle: Number(params.angle_deg || 45),
    };
  }

  if (type === "friction") {
    return {
      type: "friction",
      target: interaction?.target,
      magnitude: Number(params.mu_kinetic ?? 0.3),
    };
  }

  if (type === "spring_force") {
    return {
      type: "spring",
      target: interaction?.target,
      stiffness: Number(params.spring_constant || 60),
      anchor: Array.isArray(params.anchor)
        ? [Number(params.anchor[0] || 0), Number(params.anchor[1] || 0)]
        : undefined,
    };
  }

  return { type: "gravity", target: interaction?.target, magnitude: Number(params.g || 9.8) };
}
