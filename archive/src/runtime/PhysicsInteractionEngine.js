import Matter from "matter-js";
import runtimeEvents from "@/runtime/events/runtimeEvents";

const DEFAULT_TRAIL_LIMIT = 80;

function toVector(value, fallback = { x: 0, y: 0 }) {
  if (Array.isArray(value)) {
    return {
      x: Number(value[0] ?? fallback.x),
      y: Number(value[1] ?? fallback.y),
    };
  }

  if (value && typeof value === "object") {
    return {
      x: Number(value.x ?? fallback.x),
      y: Number(value.y ?? fallback.y),
    };
  }

  return { ...fallback };
}

export class PhysicsInteractionEngine {
  constructor({ engine, meterScale = 50, onCollision } = {}) {
    this.engine = engine;
    this.meterScale = meterScale;
    this.onCollision = onCollision;
    this.trails = new Map();
    this.springConstraints = [];
    this.collisionEffects = [];
    this.runtimeObjects = [];
    this.runtimeById = new Map();
  }

  setRuntimeObjects(runtimeObjects = []) {
    this.runtimeObjects = runtimeObjects;
    this.runtimeById = new Map(runtimeObjects.map((object) => [object.id, object]));
  }

  clear() {
    this.trails.clear();
    this.springConstraints = [];
    this.collisionEffects = [];
    this.runtimeObjects = [];
    this.runtimeById.clear();
  }

  ensureTrail(id) {
    if (!this.trails.has(id)) {
      this.trails.set(id, []);
    }

    return this.trails.get(id);
  }

  pushTrail(id, point) {
    const trail = this.ensureTrail(id);
    trail.push(point);
    if (trail.length > DEFAULT_TRAIL_LIMIT) {
      trail.shift();
    }
  }

  getTrail(id) {
    return this.trails.get(id) || [];
  }

  registerBody(body, runtimeObject) {
    body.plugin = body.plugin || {};
    body.plugin.runtime = {
      id: runtimeObject.id,
      type: runtimeObject.type,
      asset: runtimeObject.asset,
      visual: runtimeObject.visual,
    };

    this.ensureTrail(runtimeObject.id);
  }

  addCollisionEffect(pair) {
    const contact = pair.collision?.supports?.[0] || pair.bodyA.position;
    const effect = {
      time: performance.now(),
      x: Number(contact?.x ?? pair.bodyA.position.x),
      y: Number(contact?.y ?? pair.bodyA.position.y),
      intensity: Math.min(1, Math.max(pair.bodyA.speed || 0, pair.bodyB.speed || 0) / 10),
      bodies: [pair.bodyA.id, pair.bodyB.id],
    };
    this.collisionEffects.push(effect);
    if (this.collisionEffects.length > 20) {
      this.collisionEffects.shift();
    }
    runtimeEvents.emit("collision_start", {
      bodyA: pair.bodyA,
      bodyB: pair.bodyB,
      pair,
    });
  }

  applyInteractions(dt, bodiesById = new Map()) {
    const interactions = this.runtimeObjects.flatMap((object) => object.raw?.interactions || []);
    const dtSeconds = Number(dt || 0) / 1000;

    for (const interaction of interactions) {
      const type = String(interaction?.type || "").toLowerCase();
      const targetId = interaction?.target || interaction?.bind || interaction?.object || interaction?.body;
      const body = targetId ? bodiesById.get(targetId) : null;
      const parameters = interaction?.parameters || interaction || {};

      if (type === "gravity") {
        const g = Number(parameters.g ?? parameters.value ?? 9.8);
        this.engine.gravity.y = g >= 0 ? 1 : -1;
        this.engine.gravity.scale = Math.abs(g) / (this.meterScale * 1400);
        continue;
      }

      if (!body) {
        continue;
      }

      if (type === "apply_force") {
        const vector = toVector(parameters.force || parameters.vector || [0, 0]);
        const force = {
          x: vector.x / this.meterScale / 100,
          y: vector.y / this.meterScale / 100,
        };
        Matter.Body.applyForce(body, body.position, force);
        runtimeEvents.emit("force_applied", {
          target: body.id,
          vector: force,
          parameters,
        });
      }

      if (type === "velocity") {
        const velocity = toVector(parameters.velocity || parameters.vector || {
          x: parameters.vx,
          y: parameters.vy,
        });
        Matter.Body.setVelocity(body, {
          x: velocity.x * dtSeconds,
          y: velocity.y * dtSeconds,
        });
      }

      if (type === "impulse") {
        const impulse = toVector(parameters.impulse || parameters.vector || parameters.force, { x: 0, y: 0 });
        Matter.Body.setVelocity(body, {
          x: body.velocity.x + impulse.x / Math.max(1, body.mass),
          y: body.velocity.y + impulse.y / Math.max(1, body.mass),
        });
      }

      if (type === "projectile_launch") {
        const angle = Number(parameters.angle_deg ?? parameters.angle ?? 45) * (Math.PI / 180);
        const speed = Number(parameters.initial_speed ?? parameters.speed ?? 20);
        Matter.Body.setVelocity(body, {
          x: Math.cos(angle) * speed,
          y: -Math.sin(angle) * speed,
        });
      }

      if (type === "spring_force") {
        const anchor = toVector(parameters.anchor || [body.position.x, body.position.y]);
        const stiffness = Math.min(0.02, Math.max(0.0005, Number(parameters.spring_constant ?? 100) / 100000));
        const length = Math.max(10, Number(parameters.natural_length ?? 1) * this.meterScale);
        const constraint = Matter.Constraint.create({
          pointA: anchor,
          bodyB: body,
          length,
          stiffness,
          damping: 0.02,
        });
        this.springConstraints.push(constraint);
        runtimeEvents.emit("equation_updated", {
          kind: "spring",
          parameters,
          target: body.id,
        });
      }
    }
  }

  syncTrails() {
    for (const runtimeObject of this.runtimeObjects) {
      const body = runtimeObject.body;
      if (!body) continue;

      if (runtimeObject.visual?.trail || runtimeObject.type === "projectile" || runtimeObject.type === "sphere") {
        this.pushTrail(runtimeObject.id, { x: body.position.x, y: body.position.y });
      }
    }
  }

  getCollisionEffects(now = performance.now()) {
    return this.collisionEffects.map((effect) => ({
      ...effect,
      age: now - effect.time,
    }));
  }

  drawOverlays(ctx, now = performance.now()) {
    const effects = this.getCollisionEffects(now).filter((effect) => effect.age < 600);

    for (const runtimeObject of this.runtimeObjects) {
      const body = runtimeObject.body;
      if (!body) continue;

      const position = body.position;
      const velocity = body.velocity;

      if (runtimeObject.visual?.showVelocity !== false) {
        const length = Math.min(120, Math.hypot(velocity.x, velocity.y) * 4);
        if (length > 2) {
          const angle = Math.atan2(velocity.y, velocity.x);
          ctx.save();
          ctx.strokeStyle = "rgba(96,165,250,0.8)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(position.x, position.y);
          ctx.lineTo(position.x + Math.cos(angle) * length, position.y + Math.sin(angle) * length);
          ctx.stroke();
          ctx.restore();
        }
      }

      if (runtimeObject.visual?.showForces) {
        ctx.save();
        ctx.strokeStyle = "rgba(248,113,113,0.8)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(position.x, position.y);
        ctx.lineTo(position.x, position.y + 40);
        ctx.stroke();
        ctx.restore();
      }

      const trail = this.getTrail(runtimeObject.id);
      if (trail.length > 1 && runtimeObject.visual?.trail) {
        ctx.save();
        ctx.strokeStyle = runtimeObject.visual.color || "rgba(125,211,252,0.7)";
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i += 1) {
          ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    for (const effect of effects) {
      const progress = effect.age / 600;
      const radius = 12 + progress * 35;
      ctx.save();
      ctx.globalAlpha = 0.8 * (1 - progress);
      ctx.strokeStyle = "rgba(250,204,21,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    this.collisionEffects = this.collisionEffects.filter((effect) => now - effect.time < 1000);
  }
}

export default PhysicsInteractionEngine;