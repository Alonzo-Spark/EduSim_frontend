export type Vector = {
  x: number;
  y: number;
};

export type SimulationObject = {
  /** Unique identifier */
  id: string;
  /** Primitive type, e.g., "projectile", "pendulum", "ball" */
  type: string;
  /** Current position */
  position: Vector;
  /** Current velocity */
  velocity: Vector;
  /** Mass (kg) – optional, used for force calculations */
  mass?: number;
  /** Additional properties specific to the primitive */
  props?: Record<string, any>;
};

export type Environment = {
  /** Width and height of the canvas (pixels) */
  width: number;
  height: number;
  /** Gravity acceleration (m/s²) – defaults to 9.81 */
  gravity?: number;
  /** Global damping factor (0‑1) to simulate friction/air resistance */
  damping?: number;
};

export type SimulationState = {
  objects: SimulationObject[];
  env: Environment;
};
