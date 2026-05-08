import type { SimulationConstraintDsl, SimulationControlSpec, SimulationDsl, SimulationForceDsl, SimulationObjectDsl, Vector2 } from "@/lib/simulationDsl";

export interface RuntimeBody {
  id: string;
  shape: SimulationObjectDsl["shape"];
  position: Vector2;
  velocity: Vector2;
  mass: number;
  radius: number;
  size: [number, number];
  angle: number;
  angularVelocity: number;
  anchor?: Vector2;
  length?: number;
  fixed: boolean;
  color: string;
  label?: string;
  trail: boolean;
}

export interface RuntimeSnapshot {
  time: number;
  bodies: RuntimeBody[];
  world: SimulationDsl["world"];
  formula: string;
  intent: SimulationDsl["simulation"];
}

function cloneVector(vector: Vector2): Vector2 {
  return [vector[0], vector[1]];
}

function toBody(object: SimulationObjectDsl): RuntimeBody {
  return {
    id: object.id,
    shape: object.shape,
    position: cloneVector(object.position),
    velocity: cloneVector(object.velocity),
    mass: object.mass ?? 1,
    radius: object.radius ?? 14,
    size: object.size ?? [48, 48],
    angle: object.angle ?? 0,
    angularVelocity: object.angularVelocity ?? 0,
    anchor: object.anchor ? cloneVector(object.anchor) : undefined,
    length: object.length,
    fixed: Boolean(object.fixed),
    color: object.color ?? "#38bdf8",
    label: object.label,
    trail: Boolean(object.trail),
  };
}

export class PhysicsEngine {
  private dsl: SimulationDsl;
  private bodies: RuntimeBody[];
  private forces: SimulationForceDsl[];
  private constraints: SimulationConstraintDsl[];
  private time = 0;
  private running = false;
  private rafId: number | null = null;
  private lastTick = 0;
  private accumulator = 0;
  private readonly fixedStep = 1 / 60;
  private onFrame: ((snapshot: RuntimeSnapshot) => void) | null = null;

  constructor(dsl: SimulationDsl) {
    this.dsl = dsl;
    this.bodies = dsl.objects.map(toBody);
    this.forces = [...dsl.forces];
    this.constraints = [...dsl.constraints];
  }

  private buildSnapshot(): RuntimeSnapshot {
    return { time: this.time, bodies: this.bodies.map((body) => ({ ...body, position: cloneVector(body.position), velocity: cloneVector(body.velocity) })), world: { ...this.dsl.world }, formula: this.dsl.formula, intent: this.dsl.simulation };
  }

  getSnapshot(): RuntimeSnapshot {
    return this.buildSnapshot();
  }

  start(onFrame: (snapshot: RuntimeSnapshot) => void): void {
    this.onFrame = onFrame;
    if (this.running) return;
    this.running = true;
    this.lastTick = performance.now();

    const loop = (now: number) => {
      if (!this.running) return;
      const deltaSeconds = Math.min((now - this.lastTick) / 1000, 0.05);
      this.lastTick = now;
      this.step(deltaSeconds);
      this.rafId = window.requestAnimationFrame(loop);
    };

    this.rafId = window.requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  reset(): void {
    this.time = 0;
    this.accumulator = 0;
    this.bodies = this.dsl.objects.map(toBody);
    this.forces = [...this.dsl.forces];
    this.constraints = [...this.dsl.constraints];
  }

  setControl(key: SimulationControlSpec["key"], value: number): void {
    switch (key) {
      case "gravity":
        this.dsl.world.gravity = value;
        break;
      case "mass":
        this.bodies.forEach((body) => {
          if (!body.fixed) body.mass = value;
        });
        break;
      case "force":
        this.forces = this.forces.map((force) => (force.type === "applied_force" ? { ...force, magnitude: value, value: [value * 12, 0] } : force));
        break;
      case "angle":
        this.bodies.forEach((body) => {
          if (body.shape === "pendulum_bob") body.angle = (value * Math.PI) / 180;
        });
        break;
      case "velocity":
        this.bodies.forEach((body) => {
          if (body.shape === "circle" || body.shape === "orbiter") body.velocity = [value, -Math.abs(value) * 0.55];
        });
        break;
      case "length":
        this.bodies.forEach((body) => {
          if (body.shape === "pendulum_bob" || body.shape === "orbiter") body.length = value;
        });
        break;
      case "restitution":
        this.constraints = this.constraints.map((constraint) => (constraint.type === "distance" ? { ...constraint, restitution: value } : constraint));
        break;
    }
  }

  private step(deltaSeconds: number): void {
    this.accumulator += deltaSeconds * this.dsl.world.timeScale;

    while (this.accumulator >= this.fixedStep) {
      this.integrate(this.fixedStep);
      this.accumulator -= this.fixedStep;
      this.time += this.fixedStep;
    }

    this.onFrame?.(this.buildSnapshot());
  }

  private integrate(dt: number): void {
    const gravity = this.dsl.world.gravity;
    const friction = this.dsl.world.friction;
    const airResistance = this.dsl.world.airResistance;
    const width = this.dsl.world.width;
    const height = this.dsl.world.height;

    this.bodies.forEach((body) => {
      if (body.fixed) return;

      if (body.shape === "pendulum_bob" || this.hasConstraint(body.id, "hinge")) {
        this.simulatePendulum(body, gravity, dt);
        return;
      }

      if (body.shape === "orbiter") {
        this.simulateOrbit(body, dt);
        return;
      }

      const acceleration = this.calculateAcceleration(body, gravity);
      body.velocity = [body.velocity[0] + acceleration[0] * dt, body.velocity[1] + acceleration[1] * dt];
      body.velocity[0] *= 1 - airResistance * dt;
      body.velocity[1] *= 1 - airResistance * dt;

      if (this.dsl.simulation === "inclined_plane") {
        body.velocity[0] *= 1 - friction * dt;
      }

      body.position = [body.position[0] + body.velocity[0] * dt, body.position[1] + body.velocity[1] * dt];
      this.resolveWorldBounds(body, width, height);
    });

    this.resolveBodyCollisions();
    this.applyConstraintCorrections();
  }

  private calculateAcceleration(body: RuntimeBody, gravity: number): Vector2 {
    let fx = 0;
    let fy = body.mass * gravity;

    for (const force of this.forces) {
      if (force.target && force.target !== body.id) continue;

      switch (force.type) {
        case "gravity":
          fy += body.mass * (force.magnitude ?? gravity);
          break;
        case "applied_force": {
          const vector = force.value ?? [Math.cos((force.angle ?? 0) * (Math.PI / 180)), Math.sin((force.angle ?? 0) * (Math.PI / 180))];
          const magnitude = force.magnitude ?? Math.hypot(vector[0], vector[1]);
          const normalizer = Math.hypot(vector[0], vector[1]) || 1;
          fx += (vector[0] / normalizer) * magnitude;
          fy += (vector[1] / normalizer) * magnitude;
          break;
        }
        case "drag":
          fx -= body.velocity[0] * (force.magnitude ?? 0.03);
          fy -= body.velocity[1] * (force.magnitude ?? 0.03);
          break;
        case "friction":
          fx -= Math.sign(body.velocity[0]) * Math.abs(gravity * body.mass * (force.magnitude ?? 0.08));
          break;
        case "centripetal": {
          const anchor = force.anchor ?? body.anchor ?? [this.dsl.world.width / 2, this.dsl.world.height / 2];
          const dx = body.position[0] - anchor[0];
          const dy = body.position[1] - anchor[1];
          const distance = Math.hypot(dx, dy) || 1;
          const radial = [dx / distance, dy / distance];
          const speed = Math.hypot(body.velocity[0], body.velocity[1]);
          const magnitude = (body.mass * speed * speed) / distance;
          fx -= radial[0] * magnitude;
          fy -= radial[1] * magnitude;
          break;
        }
        case "spring": {
          const anchor = force.anchor ?? body.anchor ?? [body.position[0], body.position[1] - (body.length ?? 120)];
          const dx = body.position[0] - anchor[0];
          const dy = body.position[1] - anchor[1];
          const distance = Math.hypot(dx, dy) || 1;
          const restLength = body.length ?? 120;
          const stretch = distance - restLength;
          const stiffness = force.stiffness ?? 0.08;
          fx -= (dx / distance) * stretch * stiffness;
          fy -= (dy / distance) * stretch * stiffness;
          break;
        }
      }
    }

    return [fx / body.mass, fy / body.mass];
  }

  private simulatePendulum(body: RuntimeBody, gravity: number, dt: number): void {
    const anchor = body.anchor ?? [this.dsl.world.width * 0.5, 80];
    const length = body.length ?? 180;
    const angle = body.angle ?? Math.atan2(body.position[0] - anchor[0], body.position[1] - anchor[1]);
    const angularAcceleration = -(gravity / length) * Math.sin(angle);

    body.angularVelocity += angularAcceleration * dt;
    body.angularVelocity *= 0.995;
    body.angle = angle + body.angularVelocity * dt;
    body.position = [anchor[0] + length * Math.sin(body.angle), anchor[1] + length * Math.cos(body.angle)];
  }

  private simulateOrbit(body: RuntimeBody, dt: number): void {
    const anchor = body.anchor ?? [this.dsl.world.width * 0.5, this.dsl.world.height * 0.5];
    const dx = body.position[0] - anchor[0];
    const dy = body.position[1] - anchor[1];
    const radius = Math.max(Math.hypot(dx, dy), body.length ?? 100);
    const speed = Math.hypot(body.velocity[0], body.velocity[1]) || 90;
    const angularSpeed = speed / radius;
    const angle = Math.atan2(dy, dx) + angularSpeed * dt;

    body.position = [anchor[0] + radius * Math.cos(angle), anchor[1] + radius * Math.sin(angle)];
    body.velocity = [-Math.sin(angle) * speed, Math.cos(angle) * speed];
    body.angle = angle + Math.PI / 2;
  }

  private resolveWorldBounds(body: RuntimeBody, width: number, height: number): void {
    const radius = body.radius;

    if (body.position[0] - radius < 0) {
      body.position[0] = radius;
      body.velocity[0] *= -0.9;
    }
    if (body.position[0] + radius > width) {
      body.position[0] = width - radius;
      body.velocity[0] *= -0.9;
    }
    if (body.position[1] - radius < 0) {
      body.position[1] = radius;
      body.velocity[1] *= -0.9;
    }
    if (body.position[1] + radius > height) {
      body.position[1] = height - radius;
      body.velocity[1] *= -0.85;
    }
  }

  private resolveBodyCollisions(): void {
    for (let i = 0; i < this.bodies.length; i += 1) {
      for (let j = i + 1; j < this.bodies.length; j += 1) {
        const a = this.bodies[i];
        const b = this.bodies[j];
        if (a.fixed && b.fixed) continue;

        const dx = b.position[0] - a.position[0];
        const dy = b.position[1] - a.position[1];
        const distance = Math.hypot(dx, dy);
        const minDistance = a.radius + b.radius;

        if (distance === 0 || distance >= minDistance) continue;

        const nx = dx / distance;
        const ny = dy / distance;
        const overlap = minDistance - distance;

        if (!a.fixed) {
          a.position[0] -= nx * overlap * 0.5;
          a.position[1] -= ny * overlap * 0.5;
        }
        if (!b.fixed) {
          b.position[0] += nx * overlap * 0.5;
          b.position[1] += ny * overlap * 0.5;
        }

        const relativeVelocity = (b.velocity[0] - a.velocity[0]) * nx + (b.velocity[1] - a.velocity[1]) * ny;
        if (relativeVelocity > 0) continue;

        const restitution = 0.85;
        const impulse = -(1 + restitution) * relativeVelocity / (1 / a.mass + 1 / b.mass);

        if (!a.fixed) {
          a.velocity[0] -= (impulse * nx) / a.mass;
          a.velocity[1] -= (impulse * ny) / a.mass;
        }
        if (!b.fixed) {
          b.velocity[0] += (impulse * nx) / b.mass;
          b.velocity[1] += (impulse * ny) / b.mass;
        }
      }
    }
  }

  private applyConstraintCorrections(): void {
    for (const constraint of this.constraints) {
      if (constraint.type !== "distance" && constraint.type !== "hinge") continue;
      const body = constraint.bodyId ? this.bodies.find((entry) => entry.id === constraint.bodyId) : undefined;
      if (!body || body.fixed) continue;

      const anchor = constraint.anchor ?? body.anchor ?? [this.dsl.world.width / 2, 80];
      const targetLength = constraint.length ?? body.length ?? 120;
      const dx = body.position[0] - anchor[0];
      const dy = body.position[1] - anchor[1];
      const distance = Math.hypot(dx, dy) || 1;
      const nx = dx / distance;
      const ny = dy / distance;

      body.position = [anchor[0] + nx * targetLength, anchor[1] + ny * targetLength];
    }
  }

  private hasConstraint(bodyId: string, type: SimulationConstraintDsl["type"]): boolean {
    return this.constraints.some((constraint) => constraint.type === type && constraint.bodyId === bodyId);
  }
}
