export type Vector2 = {
  x: number;
  y: number;
};

export interface SimulationMeta {
  id: string;
  title: string;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface SimulationEnvironment {
  gravity: Vector2;
  friction: number;
  air_resistance: number;
  background?: string;
}

export interface ObjectPhysics {
  mass: number;
  position: Vector2;
  velocity: Vector2;
  acceleration: Vector2;
  angularVelocity: number;
  angle: number;
  fixed: boolean;
}

export interface ObjectVisual {
  color: string;
  opacity: number;
  trail: boolean;
}

export interface ObjectShape {
  type: "sphere" | "box" | "circle" | "rect";
  radius?: number;
  width?: number;
  height?: number;
}

export interface ObjectMaterial {
  restitution: number;
  friction: number;
}

export interface SimulationObject {
  id: string;
  name: string;
  type: string;
  physics: ObjectPhysics;
  visual: ObjectVisual;
  shape: ObjectShape;
  material: ObjectMaterial;
  trail?: Vector2[];
}

export interface SimulationInteraction {
  id: string;
  type: "slider" | "button" | "toggle";
  label: string;
  bind: string; // e.g. "objects[0].physics.mass"
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  value?: number | boolean;
}

export interface SimulationDSL {
  meta: SimulationMeta;
  environment: SimulationEnvironment;
  objects: SimulationObject[];
  interactions: SimulationInteraction[];
  equations?: string[];
}

// Runtime types for engine internal state
export interface RuntimeWorld {
  dsl: SimulationDSL;
  time: number;
  paused: boolean;
}

export interface SimulationSnapshot {
  time: number;
  paused: boolean;
  dsl: SimulationDSL;
}

export function toVector2(
  input?: [number, number] | Vector2 | null,
  fallback: Vector2 = { x: 0, y: 0 },
): Vector2 {
  if (!input) return { ...fallback };
  if (Array.isArray(input)) {
    return { x: Number(input[0] ?? fallback.x), y: Number(input[1] ?? fallback.y) };
  }
  return { x: Number(input.x ?? fallback.x), y: Number(input.y ?? fallback.y) };
}
