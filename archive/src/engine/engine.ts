import { SimulationState, SimulationObject, Environment, Vector } from "../types/simulation";

/**
 * Core physics engine. It does not own a rendering loop – it simply provides an
 * `update` method that mutates the supplied `SimulationState` based on the
 * elapsed time (`deltaTime` in seconds).
 */
export class Engine {
  /** Current simulation state (objects + environment). */
  private state: SimulationState;

  constructor(initialState: SimulationState) {
    // Deep copy to avoid external mutation side‑effects.
    this.state = JSON.parse(JSON.stringify(initialState));
  }

  /** Get a read‑only copy of the current state. */
  getState(): SimulationState {
    // Return a shallow copy – callers should treat it as immutable.
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Perform a physics step.
   * @param deltaTime – time since the last frame in seconds.
   */
  update(deltaTime: number) {
    const { objects, env } = this.state;
    if (!env) return;
    
    const gravity = env.gravity ?? 9.81;
    const damping = env.damping ?? 0;

    objects.forEach((obj) => {
      // Ensure velocity exists
      if (!obj.velocity) {
        obj.velocity = { x: 0, y: 0 };
      }

      // Simple Euler integration for position.
      obj.position.x += obj.velocity.x * deltaTime;
      obj.position.y += obj.velocity.y * deltaTime;

      // Apply forces based on primitive type.
      switch (obj.type) {
        case "projectile":
        case "ball":
        case "pendulum": {
          // Apply gravity to vertical component.
          obj.velocity.y += gravity * deltaTime;
          break;
        }
        default:
          break;
      }

      // Apply global damping
      if (damping > 0) {
        obj.velocity.x *= (1 - damping);
        obj.velocity.y *= (1 - damping);
      }

      // Simple boundary collision
      if (obj.position.y >= env.height) {
        obj.position.y = env.height;
        obj.velocity.y = -obj.velocity.y * 0.8;
      }
      if (obj.position.y <= 0) {
        obj.position.y = 0;
        obj.velocity.y = -obj.velocity.y * 0.8;
      }
      if (obj.position.x <= 0) {
        obj.position.x = 0;
        obj.velocity.x = -obj.velocity.x * 0.8;
      }
      if (obj.position.x >= env.width) {
        obj.position.x = env.width;
        obj.velocity.x = -obj.velocity.x * 0.8;
      }
    });
  }

  /** Replace the whole simulation state – handy when the UI loads a new DSL. */
  setState(newState: SimulationState) {
    this.state = JSON.parse(JSON.stringify(newState));
  }
}
