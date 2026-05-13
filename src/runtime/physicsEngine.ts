import {
  SimulationDSL,
  SimulationSnapshot,
  RuntimeWorld,
  SimulationObject,
} from "./dsl";
import { getValueAtPath, setValueAtPath } from "./controlBindings";

type SnapshotListener = (snapshot: SimulationSnapshot) => void;

const METER_TO_PIXEL = 50;
const CLAMP_DT = 0.033; // Max delta time to prevent physics tunneling

export class PhysicsEngine {
  private world: RuntimeWorld;
  private listeners = new Set<SnapshotListener>();
  private rafId: number | null = null;
  private lastTime = 0;

  constructor(dsl: SimulationDSL) {
    this.world = {
      dsl: structuredClone(dsl),
      time: 0,
      paused: false,
    };
    
    // Initialize objects with empty trails if enabled
    this.world.dsl.objects.forEach(obj => {
      if (obj.visual.trail) {
        obj.trail = [];
      }
    });
  }

  private emit() {
    const snapshot: SimulationSnapshot = {
      time: this.world.time,
      paused: this.world.paused,
      dsl: structuredClone(this.world.dsl),
    };
    this.listeners.forEach((listener) => listener(snapshot));
  }

  subscribe(listener: SnapshotListener) {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): SimulationSnapshot {
    return {
      time: this.world.time,
      paused: this.world.paused,
      dsl: structuredClone(this.world.dsl),
    };
  }

  start() {
    if (this.rafId !== null) return;
    this.lastTime = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - this.lastTime) / 1000, CLAMP_DT);
      this.lastTime = now;
      this.step(dt);
      this.emit();
      this.rafId = window.requestAnimationFrame(tick);
    };
    this.rafId = window.requestAnimationFrame(tick);
  }

  stop() {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  pause() {
    this.world.paused = true;
    this.emit();
  }

  resume() {
    this.world.paused = false;
    this.emit();
  }

  reset(newDsl?: SimulationDSL) {
    if (newDsl) {
      this.world.dsl = structuredClone(newDsl);
    }
    this.world.time = 0;
    this.world.paused = false;
    this.world.dsl.objects.forEach(obj => {
      if (obj.visual.trail) obj.trail = [];
    });
    this.emit();
  }

  setControl(path: string, value: any) {
    setValueAtPath(this.world.dsl, path, value);
    this.emit();
  }

  getControl(path: string): any {
    return getValueAtPath(this.world.dsl, path);
  }

  step(dt: number) {
    if (this.world.paused) return;
    this.world.time += dt;

    const { objects, environment } = this.world.dsl;
    
    // 1. Integration Step
    objects.forEach(obj => {
      if (obj.physics.fixed) return;

      const p = obj.physics;
      
      // Calculate acceleration (F/m + g)
      // Gravity is in m/s^2, convert to px/s^2 for internal calculations or keep SI and scale at render
      // Let's keep internal units in SI and scale during visual mapping/rendering for accuracy
      
      const gravity = environment.gravity;
      const ax = gravity.x;
      const ay = gravity.y;

      // Update velocity: v = v + a*dt
      p.velocity.x += ax * dt;
      p.velocity.y += ay * dt;

      // Apply damping (friction/air resistance)
      const damping = 1 - (environment.air_resistance * dt);
      p.velocity.x *= damping;
      p.velocity.y *= damping;

      // Update position: s = s + v*dt
      p.position.x += p.velocity.x * dt;
      p.position.y += p.velocity.y * dt;
      
      // Update rotation
      p.angle += p.angularVelocity * dt;

      // Update trail
      if (obj.visual.trail && obj.trail) {
        if (this.world.time % 0.1 < dt) { // Add point every 0.1s
          obj.trail.push({ ...p.position });
          if (obj.trail.length > 50) obj.trail.shift();
        }
      }
    });

    // 2. Collision Detection & Resolution (Basic implementation)
    this.resolveCollisions(objects);
  }

  private resolveCollisions(objects: SimulationObject[]) {
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const a = objects[i];
        const b = objects[j];
        
        if (a.shape.type === 'sphere' && b.shape.type === 'sphere') {
          this.resolveSphereCollision(a, b);
        }
      }
    }
  }

  private resolveSphereCollision(a: SimulationObject, b: SimulationObject) {
    const r1 = a.shape.radius || 0.5;
    const r2 = b.shape.radius || 0.5;
    
    const dx = b.physics.position.x - a.physics.position.x;
    const dy = b.physics.position.y - a.physics.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = r1 + r2;

    if (distance < minDistance) {
      // Collision detected
      const nx = dx / distance;
      const ny = dy / distance;
      
      // Relative velocity
      const rvx = b.physics.velocity.x - a.physics.velocity.x;
      const rvy = b.physics.velocity.y - a.physics.velocity.y;
      const velAlongNormal = rvx * nx + rvy * ny;

      // Do not resolve if velocities are separating
      if (velAlongNormal > 0) return;

      const e = Math.min(a.material.restitution, b.material.restitution);
      let j = -(1 + e) * velAlongNormal;
      j /= (1 / a.physics.mass + 1 / b.physics.mass);

      const impulseX = j * nx;
      const impulseY = j * ny;

      if (!a.physics.fixed) {
        a.physics.velocity.x -= (1 / a.physics.mass) * impulseX;
        a.physics.velocity.y -= (1 / a.physics.mass) * impulseY;
      }
      if (!b.physics.fixed) {
        b.physics.velocity.x += (1 / b.physics.mass) * impulseX;
        b.physics.velocity.y += (1 / b.physics.mass) * impulseY;
      }

      // Positional correction to prevent sticking
      const percent = 0.2;
      const slop = 0.01;
      const correction = Math.max(distance - minDistance, 0) / (1 / a.physics.mass + 1 / b.physics.mass) * percent;
      const cx = correction * nx;
      const cy = correction * ny;
      
      if (!a.physics.fixed) {
        a.physics.position.x -= (1 / a.physics.mass) * cx;
        a.physics.position.y -= (1 / a.physics.mass) * cy;
      }
      if (!b.physics.fixed) {
        b.physics.position.x += (1 / b.physics.mass) * cx;
        b.physics.position.y += (1 / b.physics.mass) * cy;
      }
    }
  }
}
