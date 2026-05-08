import {
  SimulationDSL,
  SimulationSnapshot,
  SimulationType,
  RuntimeBody,
  RuntimeControls,
  RuntimeEnvironment,
  RuntimeInteraction,
  RuntimeWorld,
  toVector2,
} from "./dsl";

type SnapshotListener = (snapshot: SimulationSnapshot) => void;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const hypot = (x: number, y: number) => Math.hypot(x, y);
const cloneVector = (vector: { x: number; y: number }) => ({ x: vector.x, y: vector.y });

function createEnvironment(dsl: SimulationDSL): RuntimeEnvironment {
  return {
    width: 980,
    height: 560,
    gravity: dsl.environment.gravity,
    friction: dsl.environment.friction,
    airResistance: dsl.environment.air_resistance,
    background:
      dsl.simulation_type === "projectile_motion" || dsl.simulation_type === "gravity_system"
        ? "space"
        : dsl.simulation_type === "inclined_plane"
          ? "laboratory"
          : "vacuum",
  };
}

function createControls(dsl: SimulationDSL): RuntimeControls {
  const primaryMass = dsl.entities.find((entity) => entity.mass !== null)?.mass ?? 5;
  return {
    gravity: dsl.environment.gravity,
    mass: primaryMass,
    force: 20,
    angle: 45,
    velocity: 24,
    length: 160,
    friction: dsl.environment.friction,
    radius: 140,
  };
}

function createBodyFromEntity(entity: SimulationDSL["entities"][number], index: number, simulationType: string, environment: RuntimeEnvironment): RuntimeBody {
  const baseX = environment.width * 0.32 + index * 140;
  const baseY = environment.height * 0.55;
  const properties = { ...entity.properties };

  let role: RuntimeBody["role"] = "primary";
  let type = entity.type;
  let position = { x: baseX, y: baseY };
  let velocity = { x: 0, y: 0 };
  let radius = 16;
  let width = 56;
  let height = 40;
  let fixed = false;
  let color = "#58d6ff";
  let angle = 0;
  let angularVelocity = 0;

  if (simulationType === "projectile_motion") {
    role = "projectile";
    type = "projectile";
    position = { x: environment.width * 0.16, y: environment.height * 0.74 };
    radius = 12;
    color = "#7dd3fc";
  } else if (simulationType === "pendulum") {
    role = "bob";
    type = "pendulum";
    position = { x: environment.width * 0.52, y: environment.height * 0.55 };
    radius = 16;
    color = "#f59e0b";
    properties.pivot = { x: environment.width * 0.52, y: 100 };
    properties.length = Number(properties.length ?? 180);
    angle = Number(properties.angle ?? 0.45);
  } else if (simulationType === "collision") {
    role = index === 0 ? "primary" : "secondary";
    type = "sphere";
    position = { x: environment.width * (index === 0 ? 0.28 : 0.72), y: environment.height * 0.62 };
    radius = 20;
    color = index === 0 ? "#34d399" : "#fb7185";
    velocity = { x: index === 0 ? 70 : -70, y: 0 };
  } else if (simulationType === "gravity_system") {
    role = index === 0 ? "sun" : "planet";
    type = index === 0 ? "sun" : "planet";
    position = { x: environment.width * 0.54, y: environment.height * 0.48 };
    if (index === 1) {
      position = { x: environment.width * 0.54 + 180, y: environment.height * 0.48 };
      velocity = { x: 0, y: -65 };
      properties.orbitRadius = 180;
    }
    radius = index === 0 ? 28 : 14;
    color = index === 0 ? "#fbbf24" : "#60a5fa";
    fixed = index === 0;
  } else if (simulationType === "inclined_plane") {
    role = "block";
    type = "block";
    position = { x: environment.width * 0.28, y: environment.height * 0.58 };
    width = 72;
    height = 48;
    color = "#c084fc";
    properties.planeAngle = Number(properties.planeAngle ?? 28);
    properties.distance = 0;
  } else if (simulationType === "circular_motion") {
    role = index === 0 ? "primary" : "anchor";
    type = index === 0 ? "sphere" : "block";
    if (index === 0) {
      position = { x: environment.width * 0.54 + 140, y: environment.height * 0.5 };
      velocity = { x: 0, y: -90 };
      properties.orbitCenter = { x: environment.width * 0.54, y: environment.height * 0.5 };
      properties.orbitRadius = 140;
    } else {
      position = { x: environment.width * 0.54, y: environment.height * 0.5 };
      width = 24;
      height = 24;
      fixed = true;
      color = "#f97316";
    }
    radius = index === 0 ? 16 : 10;
  } else if (simulationType === "newtons_first_law" || simulationType === "newtons_second_law" || simulationType === "newtons_third_law") {
    role = "primary";
    type = "block";
    position = { x: environment.width * 0.38, y: environment.height * 0.62 };
    width = 72;
    height = 48;
    color = "#22d3ee";
  }

  return {
    id: entity.id,
    role,
    type,
    position,
    velocity,
    mass: Number(entity.mass ?? 1),
    radius,
    width,
    height,
    angle,
    angularVelocity,
    restitution: 0.82,
    friction: environment.friction,
    fixed,
    color,
    trail: [],
    properties,
  };
}

export function buildRuntimeWorld(dsl: SimulationDSL): RuntimeWorld {
  const environment = createEnvironment(dsl);
  const controls = createControls(dsl);
  const bodies = dsl.entities.map((entity, index) => createBodyFromEntity(entity, index, dsl.simulation_type, environment));

  if (dsl.simulation_type === "projectile_motion") {
    const projectile = bodies[0];
    const angle = controls.angle * (Math.PI / 180);
    projectile.velocity = {
      x: Math.cos(angle) * controls.velocity * 20,
      y: -Math.sin(angle) * controls.velocity * 20,
    };
  }

  if (dsl.simulation_type === "pendulum") {
    const bob = bodies[0];
    const pivot = toVector2(bob.properties.pivot as { x: number; y: number } | undefined, { x: environment.width * 0.52, y: 100 });
    const length = Number(bob.properties.length ?? controls.length);
    bob.position = {
      x: pivot.x + Math.sin(Number(bob.properties.angle ?? 0.45)) * length,
      y: pivot.y + Math.cos(Number(bob.properties.angle ?? 0.45)) * length,
    };
  }

  if (dsl.simulation_type === "inclined_plane") {
    const block = bodies[0];
    const angle = Number(block.properties.planeAngle ?? 28) * (Math.PI / 180);
    const origin = { x: environment.width * 0.18, y: environment.height * 0.76 };
    const distance = Number(block.properties.distance ?? 0);
    block.position = {
      x: origin.x + Math.cos(angle) * distance,
      y: origin.y - Math.sin(angle) * distance,
    };
    block.properties.trackOrigin = origin;
  }

  if (dsl.simulation_type === "circular_motion") {
    const body = bodies[0];
    const center = toVector2(body.properties.orbitCenter as { x: number; y: number } | undefined, { x: environment.width * 0.54, y: environment.height * 0.5 });
    const radius = Number(body.properties.orbitRadius ?? controls.radius);
    body.position = { x: center.x + radius, y: center.y };
    body.properties.orbitCenter = center;
    body.properties.orbitRadius = radius;
    body.properties.angularSpeed = controls.velocity / Math.max(1, radius);
  }

  return {
    simulationType: dsl.simulation_type,
    environment,
    bodies,
    interactions: dsl.interactions,
    controls,
  };
}

function updateTrail(body: RuntimeBody) {
  body.trail.push(cloneVector(body.position));
  if (body.trail.length > 80) {
    body.trail.shift();
  }
}

function rotateVector(x: number, y: number, angle: number) {
  return {
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: x * Math.sin(angle) + y * Math.cos(angle),
  };
}

export class PhysicsEngine {
  private world: RuntimeWorld;
  private initialWorld: RuntimeWorld;
  private listeners = new Set<SnapshotListener>();
  private rafId: number | null = null;
  private lastTime = 0;
  private elapsed = 0;
  private paused = false;

  constructor(world: RuntimeWorld) {
    this.world = this.cloneWorld(world);
    this.initialWorld = this.cloneWorld(world);
  }

  private cloneWorld(world: RuntimeWorld): RuntimeWorld {
    return structuredClone(world);
  }

  private emit() {
    const snapshot: SimulationSnapshot = {
      time: this.elapsed,
      paused: this.paused,
      environment: this.world.environment,
      bodies: this.world.bodies,
      simulationType: this.world.simulationType,
    };
    this.listeners.forEach((listener) => listener(this.cloneSnapshot(snapshot)));
  }

  private cloneSnapshot(snapshot: SimulationSnapshot): SimulationSnapshot {
    return structuredClone(snapshot);
  }

  subscribe(listener: SnapshotListener) {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): SimulationSnapshot {
    return {
      time: this.elapsed,
      paused: this.paused,
      environment: this.world.environment,
      bodies: this.world.bodies,
      simulationType: this.world.simulationType,
    };
  }

  start() {
    if (this.rafId !== null) return;
    this.lastTime = performance.now();
    const tick = (now: number) => {
      const dt = clamp((now - this.lastTime) / 1000, 0, 0.033);
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
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  reset() {
    this.world = this.cloneWorld(this.initialWorld);
    this.elapsed = 0;
    this.paused = false;
  }

  setControl<K extends keyof RuntimeControls>(key: K, value: RuntimeControls[K]) {
    this.world.controls[key] = value;
    if (key === "gravity") {
      this.world.environment.gravity = value as number;
    }
    if (key === "friction") {
      this.world.environment.friction = value as number;
      this.world.bodies.forEach((body) => {
        body.friction = value as number;
      });
    }
    this.applyControlToBodies();
    this.emit();
  }

  private getPrimaryBody() {
    return this.world.bodies[0] ?? null;
  }

  private getBodyByRole(role: RuntimeBody["role"]) {
    return this.world.bodies.find((body) => body.role === role) ?? null;
  }

  private applyControlToBodies() {
    const simulationType = this.world.simulationType;
    const primary = this.getPrimaryBody();
    if (!primary) return;

    if (simulationType === "newtons_first_law" || simulationType === "newtons_second_law" || simulationType === "newtons_third_law") {
      primary.mass = this.world.controls.mass;
      const force = this.world.controls.force;
      primary.properties.appliedForce = force;
    }

    if (simulationType === "projectile_motion") {
      const angle = this.world.controls.angle * (Math.PI / 180);
      primary.velocity = {
        x: Math.cos(angle) * this.world.controls.velocity * 20,
        y: -Math.sin(angle) * this.world.controls.velocity * 20,
      };
      primary.mass = this.world.controls.mass;
    }

    if (simulationType === "pendulum") {
      primary.properties.length = this.world.controls.length;
      primary.mass = this.world.controls.mass;
      const pivot = toVector2(primary.properties.pivot as { x: number; y: number } | undefined, { x: this.world.environment.width * 0.52, y: 100 });
      const angle = this.world.controls.angle * (Math.PI / 180);
      const length = Math.max(60, this.world.controls.length);
      primary.position = {
        x: pivot.x + Math.sin(angle) * length,
        y: pivot.y + Math.cos(angle) * length,
      };
      primary.angle = angle;
      primary.angularVelocity = 0;
    }

    if (simulationType === "collision") {
      const secondary = this.getBodyByRole("secondary");
      primary.mass = this.world.controls.mass;
      primary.velocity.x = this.world.controls.velocity * 14;
      if (secondary) {
        secondary.mass = this.world.controls.mass * 0.9;
        secondary.velocity.x = -this.world.controls.velocity * 14;
      }
    }

    if (simulationType === "gravity_system") {
      const planet = this.getBodyByRole("planet");
      if (planet) {
        planet.mass = this.world.controls.mass;
        planet.properties.orbitRadius = this.world.controls.radius;
        planet.position.x = this.world.environment.width * 0.54 + this.world.controls.radius;
        planet.position.y = this.world.environment.height * 0.48;
        planet.velocity = { x: 0, y: -Math.max(24, this.world.controls.velocity * 3) };
      }
    }

    if (simulationType === "inclined_plane") {
      primary.mass = this.world.controls.mass;
      primary.properties.planeAngle = this.world.controls.angle;
      const origin = primary.properties.trackOrigin as { x: number; y: number } | undefined;
      const anchor = origin ?? { x: this.world.environment.width * 0.18, y: this.world.environment.height * 0.76 };
      const angle = this.world.controls.angle * (Math.PI / 180);
      const distance = Number(primary.properties.distance ?? 0);
      primary.position = {
        x: anchor.x + Math.cos(angle) * distance,
        y: anchor.y - Math.sin(angle) * distance,
      };
    }

    if (simulationType === "circular_motion") {
      primary.mass = this.world.controls.mass;
      const center = toVector2(primary.properties.orbitCenter as { x: number; y: number } | undefined, { x: this.world.environment.width * 0.54, y: this.world.environment.height * 0.5 });
      const radius = Math.max(60, this.world.controls.radius);
      primary.properties.orbitRadius = radius;
      primary.position = { x: center.x + radius, y: center.y };
      primary.properties.angularSpeed = this.world.controls.velocity / radius;
    }
  }

  private updateNewtonScene(dt: number) {
    const body = this.getPrimaryBody();
    if (!body) return;
    const force = Number(body.properties.appliedForce ?? this.world.controls.force);
    const acceleration = force / Math.max(0.1, body.mass);
    body.velocity.x += acceleration * dt;
    body.velocity.x *= 1 - clamp(this.world.environment.friction * 0.02, 0, 0.08);
    body.position.x += body.velocity.x * dt * 22;
    body.position.y = this.world.environment.height * 0.64;
    body.angle = 0;
    if (body.position.x > this.world.environment.width - 100 || body.position.x < 120) {
      body.velocity.x *= -body.restitution;
    }
  }

  private updateProjectileScene(dt: number) {
    const body = this.getPrimaryBody();
    if (!body) return;
    body.velocity.y += this.world.environment.gravity * dt * 26;
    body.velocity.x *= 1 - this.world.environment.airResistance * dt * 0.5;
    body.velocity.y *= 1 - this.world.environment.airResistance * dt * 0.2;
    body.position.x += body.velocity.x * dt;
    body.position.y += body.velocity.y * dt;
    const ground = this.world.environment.height * 0.82;
    if (body.position.y + body.radius >= ground) {
      body.position.y = ground - body.radius;
      body.velocity.y *= -0.55;
      body.velocity.x *= 0.92;
      if (Math.abs(body.velocity.y) < 8) {
        body.velocity.y = 0;
      }
    }
  }

  private updatePendulumScene(dt: number) {
    const bob = this.getPrimaryBody();
    if (!bob) return;
    const pivot = toVector2(bob.properties.pivot as { x: number; y: number } | undefined, { x: this.world.environment.width * 0.52, y: 100 });
    const length = Math.max(60, Number(bob.properties.length ?? this.world.controls.length));
    const g = this.world.environment.gravity * 24;
    const angularAcceleration = -(g / length) * Math.sin(bob.angle);
    bob.angularVelocity += angularAcceleration * dt;
    bob.angularVelocity *= 1 - 0.01;
    bob.angle += bob.angularVelocity * dt;
    bob.position = {
      x: pivot.x + Math.sin(bob.angle) * length,
      y: pivot.y + Math.cos(bob.angle) * length,
    };
  }

  private updateCollisionScene(dt: number) {
    const [a, b] = this.world.bodies;
    if (!a || !b) return;
    a.position.x += a.velocity.x * dt * 14;
    b.position.x += b.velocity.x * dt * 14;
    const distance = a.position.x - b.position.x;
    const minDistance = a.radius + b.radius;
    if (Math.abs(distance) <= minDistance) {
      const m1 = a.mass;
      const m2 = b.mass;
      const u1 = a.velocity.x;
      const u2 = b.velocity.x;
      const v1 = ((m1 - m2) * u1 + 2 * m2 * u2) / (m1 + m2);
      const v2 = ((m2 - m1) * u2 + 2 * m1 * u1) / (m1 + m2);
      a.velocity.x = v1 * 0.92;
      b.velocity.x = v2 * 0.92;
      const overlap = minDistance - Math.abs(distance);
      a.position.x += Math.sign(distance || 1) * overlap * 0.5;
      b.position.x -= Math.sign(distance || 1) * overlap * 0.5;
    }
    const ground = this.world.environment.height * 0.72;
    a.position.y = ground;
    b.position.y = ground;
  }

  private updateGravityScene(dt: number) {
    const sun = this.getBodyByRole("sun");
    const planet = this.getBodyByRole("planet");
    if (!sun || !planet) return;
    const dx = sun.position.x - planet.position.x;
    const dy = sun.position.y - planet.position.y;
    const distance = Math.max(40, hypot(dx, dy));
    const force = (this.world.environment.gravity * 1800 * sun.mass * planet.mass) / (distance * distance);
    const ax = (force * dx) / (distance * planet.mass);
    const ay = (force * dy) / (distance * planet.mass);
    planet.velocity.x += ax * dt;
    planet.velocity.y += ay * dt;
    planet.position.x += planet.velocity.x * dt;
    planet.position.y += planet.velocity.y * dt;
    sun.position.x = this.world.environment.width * 0.54;
    sun.position.y = this.world.environment.height * 0.48;
    planet.trail.push(cloneVector(planet.position));
    if (planet.trail.length > 120) planet.trail.shift();
  }

  private updateInclinedPlaneScene(dt: number) {
    const block = this.getPrimaryBody();
    if (!block) return;
    const angle = Number(block.properties.planeAngle ?? this.world.controls.angle) * (Math.PI / 180);
    const origin = toVector2(block.properties.trackOrigin as { x: number; y: number } | undefined, {
      x: this.world.environment.width * 0.18,
      y: this.world.environment.height * 0.76,
    });
    const acceleration = this.world.environment.gravity * (Math.sin(angle) - this.world.environment.friction * Math.cos(angle));
    const speed = Number(block.properties.trackSpeed ?? 0) + acceleration * dt;
    const distance = Math.max(0, Number(block.properties.distance ?? 0) + speed * dt * 18);
    block.properties.trackSpeed = speed;
    block.properties.distance = distance;
    block.position = {
      x: origin.x + Math.cos(angle) * distance,
      y: origin.y - Math.sin(angle) * distance,
    };
    block.velocity = {
      x: Math.cos(angle) * speed,
      y: -Math.sin(angle) * speed,
    };
  }

  private updateCircularScene(dt: number) {
    const body = this.getPrimaryBody();
    if (!body) return;
    const center = toVector2(body.properties.orbitCenter as { x: number; y: number } | undefined, {
      x: this.world.environment.width * 0.54,
      y: this.world.environment.height * 0.5,
    });
    const radius = Math.max(60, Number(body.properties.orbitRadius ?? this.world.controls.radius));
    const angularSpeed = Number(body.properties.angularSpeed ?? (this.world.controls.velocity / radius));
    const currentAngle = Number(body.properties.orbitAngle ?? 0);
    const nextAngle = currentAngle + angularSpeed * dt * 5;
    body.properties.orbitAngle = nextAngle;
    body.position = {
      x: center.x + Math.cos(nextAngle) * radius,
      y: center.y + Math.sin(nextAngle) * radius,
    };
    body.velocity = {
      x: -Math.sin(nextAngle) * angularSpeed * radius,
      y: Math.cos(nextAngle) * angularSpeed * radius,
    };
  }

  private resolveBodyTrail() {
    this.world.bodies.forEach((body) => updateTrail(body));
  }

  private resolveGenericCollisions() {
    const bodies = this.world.bodies;
    for (let i = 0; i < bodies.length; i += 1) {
      for (let j = i + 1; j < bodies.length; j += 1) {
        const a = bodies[i];
        const b = bodies[j];
        if (a.fixed && b.fixed) continue;
        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;
        const distance = hypot(dx, dy);
        const minDistance = a.radius + b.radius;
        if (distance > 0 && distance < minDistance) {
          const nx = dx / distance;
          const ny = dy / distance;
          const relativeVelocity = (b.velocity.x - a.velocity.x) * nx + (b.velocity.y - a.velocity.y) * ny;
          if (relativeVelocity > 0) continue;
          const restitution = Math.min(a.restitution, b.restitution);
          const impulse = (-(1 + restitution) * relativeVelocity) / (1 / a.mass + 1 / b.mass);
          if (!a.fixed) {
            a.velocity.x -= (impulse * nx) / a.mass;
            a.velocity.y -= (impulse * ny) / a.mass;
          }
          if (!b.fixed) {
            b.velocity.x += (impulse * nx) / b.mass;
            b.velocity.y += (impulse * ny) / b.mass;
          }
          const overlap = minDistance - distance;
          if (!a.fixed) {
            a.position.x -= nx * overlap * 0.5;
            a.position.y -= ny * overlap * 0.5;
          }
          if (!b.fixed) {
            b.position.x += nx * overlap * 0.5;
            b.position.y += ny * overlap * 0.5;
          }
        }
      }
    }
  }

  private clampToViewport(body: RuntimeBody) {
    const maxX = this.world.environment.width - body.radius;
    const maxY = this.world.environment.height - body.radius;
    body.position.x = clamp(body.position.x, body.radius, maxX);
    body.position.y = clamp(body.position.y, body.radius, maxY);
  }

  step(dt: number) {
    if (this.paused) return;
    this.elapsed += dt;
    const simulationType = this.world.simulationType;

    if (simulationType === "newtons_first_law" || simulationType === "newtons_second_law" || simulationType === "newtons_third_law") {
      this.updateNewtonScene(dt);
    } else if (simulationType === "projectile_motion") {
      this.updateProjectileScene(dt);
    } else if (simulationType === "pendulum") {
      this.updatePendulumScene(dt);
    } else if (simulationType === "collision") {
      this.updateCollisionScene(dt);
    } else if (simulationType === "gravity_system") {
      this.updateGravityScene(dt);
    } else if (simulationType === "inclined_plane") {
      this.updateInclinedPlaneScene(dt);
    } else if (simulationType === "circular_motion") {
      this.updateCircularScene(dt);
    }

    this.resolveBodyTrail();
    this.world.bodies.forEach((body) => {
      if (!body.fixed && simulationType !== "pendulum" && simulationType !== "gravity_system" && simulationType !== "circular_motion" && simulationType !== "inclined_plane") {
        this.clampToViewport(body);
      }
    });

    if (simulationType === "collision") {
      this.resolveGenericCollisions();
    }
  }
}
