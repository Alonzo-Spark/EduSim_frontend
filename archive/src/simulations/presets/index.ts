import type { SimulationDSL } from "@/runtime/dsl";

export interface SimulationPreset {
  id: string;
  title: string;
  description: string;
  icon: string;
  scene: SimulationDSL;
}

function baseMeta(id: string, title: string, topic: string, difficulty: SimulationDSL["meta"]["difficulty"]): SimulationDSL["meta"] {
  return {
    id,
    title,
    topic,
    difficulty,
  };
}

const NewtonsLawPreset: SimulationPreset = {
  id: "newtons-law",
  title: "Newton's Laws",
  description: "Force, mass, and acceleration with visible vectors.",
  icon: "force",
  scene: {
    meta: baseMeta("newtons-law", "Newton's Laws", "Force and Motion", "intermediate"),
    environment: { gravity: { x: 0, y: 9.81 }, friction: 0.08, air_resistance: 0.01, background: "#06111f" },
    objects: [
      {
        id: "block_1",
        name: "Applied Force Block",
        type: "block",
        physics: { mass: 5, position: { x: 4, y: 8 }, velocity: { x: 0, y: 0 }, acceleration: { x: 0, y: 0 }, angularVelocity: 0, angle: 0, fixed: false },
        visual: { color: "#60a5fa", opacity: 0.95, trail: true },
        shape: { type: "rect", width: 2, height: 1 },
        material: { restitution: 0.18, friction: 0.2 },
      },
    ],
    interactions: [
      { id: "force_slider", type: "slider", label: "Applied Force", bind: "objects[0].physics.mass", min: 1, max: 20, step: 0.5, unit: "kg", value: 5 },
    ],
    equations: ["F = ma", "\u2211F = ma"],
  },
};

const ProjectileMotionPreset: SimulationPreset = {
  id: "projectile-motion",
  title: "Projectile Motion",
  description: "Launch angle, speed, and trajectory path.",
  icon: "trajectory",
  scene: {
    meta: baseMeta("projectile-motion", "Projectile Motion", "Kinematics", "intermediate"),
    environment: { gravity: { x: 0, y: 9.81 }, friction: 0.01, air_resistance: 0.004, background: "#071423" },
    objects: [
      {
        id: "launcher",
        name: "Launcher",
        type: "block",
        physics: { mass: 10, position: { x: 3, y: 11.5 }, velocity: { x: 0, y: 0 }, acceleration: { x: 0, y: 0 }, angularVelocity: 0, angle: 0, fixed: true },
        visual: { color: "#93c5fd", opacity: 1, trail: false },
        shape: { type: "rect", width: 2.5, height: 0.6 },
        material: { restitution: 0.1, friction: 0.9 },
      },
      {
        id: "projectile_1",
        name: "Projectile",
        type: "projectile",
        physics: { mass: 2, position: { x: 4, y: 10.5 }, velocity: { x: 18, y: -14 }, acceleration: { x: 0, y: 0 }, angularVelocity: 0, angle: 0, fixed: false },
        visual: { color: "#f59e0b", opacity: 1, trail: true, showVelocity: true },
        shape: { type: "circle", radius: 0.38 },
        material: { restitution: 0.55, friction: 0.08 },
        interactions: [
          { type: "projectile_launch", target: "projectile_1", parameters: { angle_deg: 45, initial_speed: 18 } },
        ],
      },
    ],
    interactions: [
      { id: "launch_angle", type: "slider", label: "Launch Angle", bind: "objects[1].physics.angle", min: 15, max: 75, step: 1, unit: "deg", value: 45 },
    ],
    equations: ["x = u cos(\u03b8) t", "y = u sin(\u03b8) t - 1/2 g t^2"],
  },
};

const CollisionPreset: SimulationPreset = {
  id: "collision",
  title: "Collision Lab",
  description: "Momentum transfer between two vehicles.",
  icon: "collision",
  scene: {
    meta: baseMeta("collision", "Collision Lab", "Momentum", "advanced"),
    environment: { gravity: { x: 0, y: 0 }, friction: 0.02, air_resistance: 0.01, background: "#070c16" },
    objects: [
      {
        id: "truck_a",
        name: "Truck A",
        type: "truck",
        physics: { mass: 1200, position: { x: 3, y: 8 }, velocity: { x: 10, y: 0 }, acceleration: { x: 0, y: 0 }, angularVelocity: 0, angle: 0, fixed: false },
        visual: { color: "#22d3ee", opacity: 1, trail: true, showVelocity: true },
        shape: { type: "rect", width: 3.2, height: 1.4 },
        material: { restitution: 0.25, friction: 0.5 },
      },
      {
        id: "truck_b",
        name: "Truck B",
        type: "truck",
        physics: { mass: 1200, position: { x: 11, y: 8 }, velocity: { x: -8, y: 0 }, acceleration: { x: 0, y: 0 }, angularVelocity: 0, angle: 0, fixed: false },
        visual: { color: "#fb7185", opacity: 1, trail: true, showVelocity: true },
        shape: { type: "rect", width: 3.2, height: 1.4 },
        material: { restitution: 0.25, friction: 0.5 },
      },
    ],
    interactions: [],
    equations: ["p = mv", "\u2211p_before = \u2211p_after"],
  },
};

const GravityPreset: SimulationPreset = {
  id: "gravity",
  title: "Gravity Field",
  description: "Drop bodies under Earth or Moon gravity.",
  icon: "gravity",
  scene: {
    meta: baseMeta("gravity", "Gravity Field", "Gravity", "beginner"),
    environment: { gravity: { x: 0, y: 1.62 }, friction: 0.03, air_resistance: 0.005, background: "#08111a" },
    objects: [
      {
        id: "gravity_ball",
        name: "Gravity Ball",
        type: "sphere",
        physics: { mass: 3, position: { x: 5, y: 3 }, velocity: { x: 0, y: 0 }, acceleration: { x: 0, y: 0 }, angularVelocity: 0, angle: 0, fixed: false },
        visual: { color: "#a78bfa", opacity: 1, trail: true, showVelocity: true },
        shape: { type: "circle", radius: 0.42 },
        material: { restitution: 0.4, friction: 0.2 },
      },
    ],
    interactions: [],
    equations: ["F = mg", "W = mg"],
  },
};

const FrictionPreset: SimulationPreset = {
  id: "friction",
  title: "Friction Track",
  description: "A sliding body slows down on a rough surface.",
  icon: "friction",
  scene: {
    meta: baseMeta("friction", "Friction Track", "Friction", "beginner"),
    environment: { gravity: { x: 0, y: 9.81 }, friction: 0.28, air_resistance: 0.01, background: "#0a1117" },
    objects: [
      {
        id: "sled",
        name: "Sled",
        type: "block",
        physics: { mass: 8, position: { x: 3, y: 8 }, velocity: { x: 12, y: 0 }, acceleration: { x: 0, y: 0 }, angularVelocity: 0, angle: 0, fixed: false },
        visual: { color: "#34d399", opacity: 1, trail: true, showVelocity: true },
        shape: { type: "rect", width: 2, height: 1 },
        material: { restitution: 0.08, friction: 0.8 },
      },
      {
        id: "track",
        name: "Track",
        type: "plane",
        physics: { mass: 0, position: { x: 10, y: 12 }, velocity: { x: 0, y: 0 }, acceleration: { x: 0, y: 0 }, angularVelocity: 0, angle: 0, fixed: true },
        visual: { color: "#475569", opacity: 1, trail: false },
        shape: { type: "rect", width: 18, height: 0.6 },
        material: { restitution: 0.05, friction: 0.95 },
      },
    ],
    interactions: [],
    equations: ["f_f = \u03bcN", "a = (F - f_f) / m"],
  },
};

const PendulumPreset: SimulationPreset = {
  id: "pendulum",
  title: "Pendulum Oscillation",
  description: "A bob swings back and forth under gravity.",
  icon: "pendulum",
  scene: {
    meta: baseMeta("pendulum", "Pendulum Oscillation", "Oscillations", "intermediate"),
    environment: { gravity: { x: 0, y: 9.81 }, friction: 0.01, air_resistance: 0.008, background: "#081018" },
    objects: [
      {
        id: "bob",
        name: "Pendulum Bob",
        type: "pendulum",
        physics: { mass: 2, position: { x: 8, y: 5 }, velocity: { x: 0, y: 0 }, acceleration: { x: 0, y: 0 }, angularVelocity: 0, angle: 0, fixed: false },
        visual: { color: "#38bdf8", opacity: 1, trail: true, showVelocity: true },
        shape: { type: "circle", radius: 0.35 },
        material: { restitution: 0.75, friction: 0.1 },
        interactions: [
          { type: "spring_force", target: "bob", parameters: { anchor: [8, 2], spring_constant: 120, natural_length: 3 } },
        ],
      },
    ],
    interactions: [],
    equations: ["T = 2\u03c0\u221a(L/g)"],
  },
};

const CircularMotionPreset: SimulationPreset = {
  id: "circular-motion",
  title: "Circular Motion",
  description: "A body moves tangentially while the force points inward.",
  icon: "orbit",
  scene: {
    meta: baseMeta("circular-motion", "Circular Motion", "Circular Motion", "advanced"),
    environment: { gravity: { x: 0, y: 0 }, friction: 0.02, air_resistance: 0.01, background: "#06131f" },
    objects: [
      {
        id: "orbiter",
        name: "Orbiter",
        type: "particle",
        physics: { mass: 1, position: { x: 8, y: 8 }, velocity: { x: 0, y: -12 }, acceleration: { x: 0, y: 0 }, angularVelocity: 0, angle: 0, fixed: false },
        visual: { color: "#f97316", opacity: 1, trail: true, showVelocity: true, showForces: true },
        shape: { type: "circle", radius: 0.18 },
        material: { restitution: 0.45, friction: 0.05 },
      },
    ],
    interactions: [
      { id: "centripetal", type: "slider", label: "Centripetal Force", bind: "objects[0].physics.mass", min: 0.5, max: 10, step: 0.1, unit: "kg", value: 1 },
    ],
    equations: ["F_c = mv^2 / r", "a_c = v^2 / r"],
  },
};

export const SIMULATION_PRESETS: SimulationPreset[] = [
  NewtonsLawPreset,
  ProjectileMotionPreset,
  CollisionPreset,
  GravityPreset,
  FrictionPreset,
  PendulumPreset,
  CircularMotionPreset,
];

export function getPresetById(id: string) {
  return SIMULATION_PRESETS.find((preset) => preset.id === id) || SIMULATION_PRESETS[0];
}

export function getPresetScene(id: string) {
  return getPresetById(id)?.scene;
}

export default SIMULATION_PRESETS;