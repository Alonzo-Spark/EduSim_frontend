export type SimulationType =
  | "newtons_first_law"
  | "newtons_second_law"
  | "newtons_third_law"
  | "projectile_motion"
  | "pendulum"
  | "collision"
  | "gravity_system"
  | "inclined_plane"
  | "circular_motion";

export type Vector2 = {
  x: number;
  y: number;
};

export type RuntimeEntity = {
  id: string;
  type: string;
  mass: number | null;
  properties: Record<string, unknown>;
};

export type RuntimeInteraction = {
  type: string;
  target: string;
  parameters: Record<string, unknown>;
};

export type RuntimeVisualization = {
  type: string;
};

export type SimulationDSL = {
  simulation_type: SimulationType | string;
  topic: string;
  environment: {
    gravity: number;
    friction: number;
    air_resistance: number;
  };
  entities: RuntimeEntity[];
  interactions: RuntimeInteraction[];
  visualizations: RuntimeVisualization[];
  equations: string[];
};

export type RuntimeBodyRole =
  | "primary"
  | "secondary"
  | "planet"
  | "sun"
  | "bob"
  | "anchor"
  | "projectile"
  | "block";

export type RuntimeBody = {
  id: string;
  role: RuntimeBodyRole;
  type: string;
  position: Vector2;
  velocity: Vector2;
  mass: number;
  radius: number;
  width: number;
  height: number;
  angle: number;
  angularVelocity: number;
  restitution: number;
  friction: number;
  fixed: boolean;
  color: string;
  trail: Vector2[];
  properties: Record<string, unknown>;
};

export type RuntimeEnvironment = {
  width: number;
  height: number;
  gravity: number;
  friction: number;
  airResistance: number;
  background: string;
};

export type RuntimeControls = {
  gravity: number;
  mass: number;
  force: number;
  angle: number;
  velocity: number;
  length: number;
  friction: number;
  radius: number;
};

export type RuntimeWorld = {
  simulationType: SimulationType | string;
  environment: RuntimeEnvironment;
  bodies: RuntimeBody[];
  interactions: RuntimeInteraction[];
  controls: RuntimeControls;
};

export type SimulationSnapshot = {
  time: number;
  paused: boolean;
  environment: RuntimeEnvironment;
  bodies: RuntimeBody[];
  simulationType: SimulationType | string;
};

export function toVector2(input?: [number, number] | Vector2 | null, fallback: Vector2 = { x: 0, y: 0 }): Vector2 {
  if (!input) return { ...fallback };
  if (Array.isArray(input)) {
    return { x: Number(input[0] ?? fallback.x), y: Number(input[1] ?? fallback.y) };
  }
  return { x: Number(input.x ?? fallback.x), y: Number(input.y ?? fallback.y) };
}
