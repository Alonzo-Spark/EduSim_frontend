import {
  SimulationDSL,
  SimulationSnapshot,
  RuntimeWorld,
  SimulationObject,
} from "./dsl";
import { getValueAtPath, setValueAtPath } from "./controlBindings";
import runtimeEvents from "@/runtime/events/runtimeEvents";

type SnapshotListener = (snapshot: SimulationSnapshot) => void;

const METER_TO_PIXEL = 50;
const CLAMP_DT = 0.033; // Max delta time to prevent physics tunneling

function safeNumber(value: any, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeVector(input?: { x?: number; y?: number } | null, fallback = { x: 0, y: 0 }) {
  return {
    x: safeNumber(input?.x, fallback.x),
    y: safeNumber(input?.y, fallback.y),
  };
}

function getShapeRadius(object: SimulationObject) {
  const shape = object.shape;
  if (shape.type === "circle" || shape.type === "sphere") {
    return Math.max(0.1, safeNumber(shape.radius, 0.5));
  }

  if (shape.type === "rect" || shape.type === "box") {
    const halfWidth = Math.max(0.1, safeNumber(shape.width, 1) / 2);
    const halfHeight = Math.max(0.1, safeNumber(shape.height, 1) / 2);
    return Math.hypot(halfWidth, halfHeight);
  }

  return Math.max(0.1, safeNumber(shape.radius ?? Math.max(shape.width ?? 1, shape.height ?? 1) / 2, 0.5));
}

function getObjectPosition(object: SimulationObject) {
  return normalizeVector(object.physics?.position, object.position || { x: 0, y: 0 });
}

function getObjectVelocity(object: SimulationObject) {
  return normalizeVector(object.physics?.velocity, object.velocity || { x: 0, y: 0 });
}

function getObjectMass(object: SimulationObject) {
  const mass = safeNumber(object.physics?.mass, 1);
  return mass > 0 ? mass : 1;
}

function getObjectRestitution(object: SimulationObject) {
  return Math.min(1, Math.max(0, safeNumber(object.material?.restitution, 0.8)));
}

function getObjectFriction(object: SimulationObject) {
  return Math.max(0, safeNumber(object.material?.friction, 0));
}

export class PhysicsEngine {
  private world: RuntimeWorld;
  private listeners = new Set<SnapshotListener>();
  private rafId: number | null = null;
  private lastTime = 0;
  private speed = 1;

  constructor(dsl: SimulationDSL) {
    this.world = {
      dsl: structuredClone(dsl),
      time: 0,
      paused: false,
    };
    
    // Initialize objects with empty trails if enabled
    this.world.dsl.objects.forEach((obj) => {
      if (obj.visual?.trail) {
        obj.trail = [];
      }
      runtimeEvents.emit("entity_spawned", { entityId: obj.id, object: obj });
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
      let dt = Math.min(Math.max((now - this.lastTime) / 1000, 0), CLAMP_DT);
      dt *= this.speed;
      this.lastTime = now;
      if (!this.world.paused) {
        this.step(dt);
      } else {
        this.emit();
      }
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
    runtimeEvents.emit("runtime_paused", { time: this.world.time });
  }

  resume() {
    this.world.paused = false;
    this.emit();
    runtimeEvents.emit("runtime_resumed", { time: this.world.time });
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
    runtimeEvents.emit("runtime_state_changed", { state: this.world.paused ? "PAUSED" : "READY" });
  }

  setControl(path: string, value: any) {
    setValueAtPath(this.world.dsl, path, value);
    this.emit();
  }

  setSpeed(multiplier: number) {
    this.speed = Math.max(0, Number(multiplier) || 1);
    this.emit();
  }

  getControl(path: string): any {
    return getValueAtPath(this.world.dsl, path);
  }

  step(dt: number = 1 / 60) {
    const stepDt = Math.min(Math.max(safeNumber(dt, 1 / 60), 0), CLAMP_DT);
    if (stepDt <= 0) {
      this.emit();
      return;
    }

    this.world.time += stepDt;

    const { objects, environment } = this.world.dsl;

    // 1. Integration Step
    objects.forEach((obj) => {
      if (obj.physics?.fixed) return;

      const p = obj.physics;

      const gravity = normalizeVector(environment.gravity, { x: 0, y: 0 });
      const ax = safeNumber(gravity.x, 0);
      const ay = safeNumber(gravity.y, 0);

      // Update velocity: v = v + a*dt
      p.velocity.x = safeNumber(p.velocity?.x, 0) + ax * stepDt;
      p.velocity.y = safeNumber(p.velocity?.y, 0) + ay * stepDt;

      // Apply damping (friction/air resistance)
      const airResistance = Math.max(0, safeNumber(environment.air_resistance, 0));
      const surfaceFriction = Math.max(0, safeNumber(environment.friction, 0));
      const damping = Math.max(0, 1 - ((airResistance + surfaceFriction * 0.25) * stepDt));
      p.velocity.x *= damping;
      p.velocity.y *= damping;

      // Update position: s = s + v*dt
      p.position.x = safeNumber(p.position?.x, 0) + p.velocity.x * stepDt;
      p.position.y = safeNumber(p.position?.y, 0) + p.velocity.y * stepDt;
      
      // Update rotation
      p.angle = safeNumber(p.angle, 0) + safeNumber(p.angularVelocity, 0) * stepDt;

      if (!Number.isFinite(p.position.x)) p.position.x = 0;
      if (!Number.isFinite(p.position.y)) p.position.y = 0;
      if (!Number.isFinite(p.velocity.x)) p.velocity.x = 0;
      if (!Number.isFinite(p.velocity.y)) p.velocity.y = 0;
      if (!Number.isFinite(p.angle)) p.angle = 0;

      // Update trail
      if (obj.visual?.trail && obj.trail) {
        if (this.world.time % 0.1 < stepDt) {
          obj.trail.push({ ...p.position });
          if (obj.trail.length > 50) obj.trail.shift();
        }
      }
    });

    // 2. Collision Detection & Resolution (Basic implementation)
    this.resolveCollisions(objects);
    this.emit();
  }

  private resolveCollisions(objects: SimulationObject[]) {
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const a = objects[i];
        const b = objects[j];

        this.resolvePairCollision(a, b);
      }
    }
  }

  private resolvePairCollision(a: SimulationObject, b: SimulationObject) {
    const positionA = getObjectPosition(a);
    const positionB = getObjectPosition(b);
    const velocityA = getObjectVelocity(a);
    const velocityB = getObjectVelocity(b);
    const massA = getObjectMass(a);
    const massB = getObjectMass(b);
    const radiusA = getShapeRadius(a);
    const radiusB = getShapeRadius(b);
    const dx = positionB.x - positionA.x;
    const dy = positionB.y - positionA.y;
    const distance = Math.hypot(dx, dy);
    const minimumDistance = radiusA + radiusB;

    if (distance >= minimumDistance) {
      return;
    }

    const normal = distance > 1e-6 ? { x: dx / distance, y: dy / distance } : { x: 1, y: 0 };
    const relativeVelocity = {
      x: velocityB.x - velocityA.x,
      y: velocityB.y - velocityA.y,
    };
    const velocityAlongNormal = relativeVelocity.x * normal.x + relativeVelocity.y * normal.y;
    const restitution = Math.min(getObjectRestitution(a), getObjectRestitution(b));

    runtimeEvents.emit("collision_start", {
      bodyA: a,
      bodyB: b,
      kind: `${a.shape.type}_${b.shape.type}`,
      contactPoint: {
        x: (positionA.x + positionB.x) / 2,
        y: (positionA.y + positionB.y) / 2,
      },
      preVelocityA: velocityA,
      preVelocityB: velocityB,
      restitution,
    });

    if (velocityAlongNormal < 0) {
      const inverseMassA = a.physics?.fixed ? 0 : 1 / massA;
      const inverseMassB = b.physics?.fixed ? 0 : 1 / massB;
      const inverseMassSum = inverseMassA + inverseMassB;

      if (inverseMassSum > 0) {
        const impulseMagnitude = -(1 + restitution) * velocityAlongNormal / inverseMassSum;
        const impulse = {
          x: impulseMagnitude * normal.x,
          y: impulseMagnitude * normal.y,
        };

        if (!a.physics?.fixed) {
          a.physics.velocity.x = safeNumber(a.physics.velocity?.x, 0) - impulse.x * inverseMassA;
          a.physics.velocity.y = safeNumber(a.physics.velocity?.y, 0) - impulse.y * inverseMassA;
        }

        if (!b.physics?.fixed) {
          b.physics.velocity.x = safeNumber(b.physics.velocity?.x, 0) + impulse.x * inverseMassB;
          b.physics.velocity.y = safeNumber(b.physics.velocity?.y, 0) + impulse.y * inverseMassB;
        }

        const penetration = Math.max(0, minimumDistance - distance);
        const correctionMagnitude = (penetration / inverseMassSum) * 0.85;
        const correction = {
          x: correctionMagnitude * normal.x,
          y: correctionMagnitude * normal.y,
        };

        if (!a.physics?.fixed) {
          a.physics.position.x = safeNumber(a.physics.position?.x, 0) - correction.x * inverseMassA;
          a.physics.position.y = safeNumber(a.physics.position?.y, 0) - correction.y * inverseMassA;
        }

        if (!b.physics?.fixed) {
          b.physics.position.x = safeNumber(b.physics.position?.x, 0) + correction.x * inverseMassB;
          b.physics.position.y = safeNumber(b.physics.position?.y, 0) + correction.y * inverseMassB;
        }

        runtimeEvents.emit("equation_updated", {
          kind: "collision",
          bodyA: a,
          bodyB: b,
          impulseMagnitude,
          restitution,
          momentum: massA * Math.hypot(a.physics.velocity.x, a.physics.velocity.y) + massB * Math.hypot(b.physics.velocity.x, b.physics.velocity.y),
        });
      }
    }

    runtimeEvents.emit("collision_end", {
      bodyA: a,
      bodyB: b,
      kind: `${a.shape.type}_${b.shape.type}`,
      contactPoint: {
        x: (positionA.x + positionB.x) / 2,
        y: (positionA.y + positionB.y) / 2,
      },
      restitution,
      friction: Math.max(getObjectFriction(a), getObjectFriction(b)),
      postVelocityA: getObjectVelocity(a),
      postVelocityB: getObjectVelocity(b),
    });
  }
}
