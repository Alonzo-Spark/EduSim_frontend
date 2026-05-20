import runtimeEvents, { RuntimeEventName } from "@/runtime/events/runtimeEvents";
import { analyzeCollision } from "@/runtime/analysis/collisionAnalyzer";

export type ExplanationEntry = {
  id: string;
  title: string;
  body: string;
  equation?: string;
  timestamp: number;
  kind: string;
};

type ExplainableSnapshot = {
  dsl?: any;
  time?: number;
};

function safeNum(value: any, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildCollisionExplanation(payload: any, snapshot?: ExplainableSnapshot): ExplanationEntry {
  const analysis = analyzeCollision({
    bodyA: payload?.bodyA,
    bodyB: payload?.bodyB,
    restitution: payload?.restitution,
    durationMs: payload?.durationMs,
    impulse: payload?.impulseMagnitude,
    contactPoint: payload?.contactPoint,
    preVelocityA: payload?.preVelocityA,
    preVelocityB: payload?.preVelocityB,
    postVelocityA: payload?.postVelocityA,
    postVelocityB: payload?.postVelocityB,
  });
  const a = payload?.bodyA?.mass ?? payload?.massA ?? payload?.a?.mass ?? 1;
  const b = payload?.bodyB?.mass ?? payload?.massB ?? payload?.b?.mass ?? 1;
  const va = payload?.bodyA?.velocity?.x ?? payload?.va ?? payload?.velocityA ?? 0;
  const vb = payload?.bodyB?.velocity?.x ?? payload?.vb ?? payload?.velocityB ?? 0;
  const pBefore = a * va + b * vb;

  return {
    id: `collision_${Date.now().toString(36)}`,
    title: "Collision: momentum transfer",
    body: `${analysis.summary} Momentum flows from the faster body toward the slower one, while restitution controls how much kinetic energy returns after impact.`,
    equation: `p_total = (${a.toFixed(2)} kg)(${va.toFixed(2)} m/s) + (${b.toFixed(2)} kg)(${vb.toFixed(2)} m/s) = ${pBefore.toFixed(2)} kg·m/s`,
    timestamp: performance.now(),
    kind: "collision",
  };
}

function buildSpringExplanation(payload: any): ExplanationEntry {
  const k = safeNum(payload?.parameters?.k ?? payload?.spring_constant, 50);
  const x = safeNum(payload?.extension ?? payload?.displacement ?? 0.25, 0.25);
  const force = -k * x;
  return {
    id: `spring_${Date.now().toString(36)}`,
    title: "Spring: restoring force",
    body: "Hooke's law says the restoring force is proportional to displacement and acts opposite to the stretch/compression.",
    equation: `F = -kx = -(${k.toFixed(2)} N/m)(${x.toFixed(2)} m) = ${force.toFixed(2)} N`,
    timestamp: performance.now(),
    kind: "spring",
  };
}

function buildProjectileExplanation(payload: any): ExplanationEntry {
  const g = safeNum(payload?.parameters?.gravity ?? payload?.g ?? 9.81, 9.81);
  const vy = safeNum(payload?.velocity?.y ?? payload?.vy ?? 0, 0);
  return {
    id: `projectile_${Date.now().toString(36)}`,
    title: "Projectile: gravity changes vertical motion",
    body: "Gravity accelerates the object downward while horizontal velocity remains approximately constant without drag.",
    equation: `a_y = -${g.toFixed(2)} m/s²,  v_y(t) = v_y(0) - gt = ${vy.toFixed(2)} - ${g.toFixed(2)}t`,
    timestamp: performance.now(),
    kind: "projectile",
  };
}

export class ExplanationEngine {
  private entries: ExplanationEntry[] = [];
  private unsubscribe: Array<() => void> = [];
  private mode: "guided" | "slow" | "step" = "guided";

  constructor(private snapshotProvider?: () => ExplainableSnapshot | null) {}

  setMode(mode: "guided" | "slow" | "step") {
    this.mode = mode;
  }

  start() {
    this.stop();

    this.unsubscribe.push(runtimeEvents.on("collision_start", (payload) => this.push(buildCollisionExplanation(payload, this.snapshotProvider?.() ?? undefined))));
    this.unsubscribe.push(runtimeEvents.on("force_applied", (payload) => this.push({
      id: `force_${Date.now().toString(36)}`,
      title: "Force applied",
      body: this.mode === "step"
        ? "Step 1: identify the net force. Step 2: apply F = ma. Step 3: the body accelerates in the force direction."
        : "A net force changes momentum according to F = ma and impulse changes velocity over time. When the force persists, the body accelerates in the direction of the net force.",
      equation: `F = ma  and  J = FΔt`,
      timestamp: performance.now(),
      kind: "force",
    })));
    this.unsubscribe.push(runtimeEvents.on("equation_updated", (payload) => {
      if (payload?.kind === "spring") this.push(buildSpringExplanation(payload));
      if (payload?.kind === "projectile") this.push(buildProjectileExplanation(payload));
      if (payload?.kind === "collision") this.push(buildCollisionExplanation(payload, this.snapshotProvider?.() ?? undefined));
    }));
    this.unsubscribe.push(runtimeEvents.on("runtime_paused", () => this.push({
      id: `pause_${Date.now().toString(36)}`,
      title: "Pause and inspect",
      body: this.mode === "guided"
        ? "Pausing the simulation freezes the physics state so you can examine vectors, equations, and interaction chains frame by frame."
        : "Pause to inspect the current state and compare the before/after energy and momentum values.",
      equation: "Δt → 0",
      timestamp: performance.now(),
      kind: "control",
    })));
  }

  stop() {
    this.unsubscribe.forEach((dispose) => dispose());
    this.unsubscribe = [];
  }

  push(entry: ExplanationEntry) {
    this.entries = [entry, ...this.entries].slice(0, 20);
  }

  getEntries() {
    return this.entries;
  }
}

export function createExplanationEngine(snapshotProvider?: () => ExplainableSnapshot | null) {
  return new ExplanationEngine(snapshotProvider);
}

export function emitEducationalEvent(event: RuntimeEventName, payload: Record<string, any> = {}) {
  runtimeEvents.emit(event, payload);
}
