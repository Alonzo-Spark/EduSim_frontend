import { ReplayFrame } from "@/runtime/replay/simulationReplay";

type MetricSeries = {
  momentum: number[];
  kineticEnergy: number[];
  potentialEnergy: number[];
  forceMagnitude: number[];
  collisionFrequency: number[];
  restitutionEfficiency: number[];
  acceleration: number[];
  fps: number[];
};

type AnalyticsSnapshot = {
  frameId: number;
  time: number;
  metrics: {
    momentum: number;
    kineticEnergy: number;
    potentialEnergy: number;
    forceMagnitude: number;
    collisionFrequency: number;
    restitutionEfficiency: number;
    acceleration: number;
    fps: number;
    stability: number;
    momentumChangeRate: number;
    energyChangeRate: number;
  };
  rollingAverages: {
    momentum: number;
    kineticEnergy: number;
    potentialEnergy: number;
    forceMagnitude: number;
    fps: number;
  };
  summary: string;
};

function safeNum(value: any, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function windowAverage(values: number[], windowSize = 20) {
  const slice = values.slice(-windowSize);
  if (!slice.length) return 0;
  return slice.reduce((sum, value) => sum + value, 0) / slice.length;
}

function growthRate(values: number[]) {
  if (values.length < 2) return 0;
  const prev = values[values.length - 2];
  const curr = values[values.length - 1];
  return curr - prev;
}

export class PhysicsAnalytics {
  private series: MetricSeries = {
    momentum: [],
    kineticEnergy: [],
    potentialEnergy: [],
    forceMagnitude: [],
    collisionFrequency: [],
    restitutionEfficiency: [],
    acceleration: [],
    fps: [],
  };
  private snapshots: AnalyticsSnapshot[] = [];
  private lastFrameTime = performance.now();

  ingestFrame(frame: ReplayFrame, options: { fps?: number; collisions?: number[]; restitution?: number } = {}) {
    const momentum = frame.entities.reduce((total, entity) => total + safeNum(entity.mass, 1) * Math.hypot(entity.velocity.x, entity.velocity.y), 0);
    const kineticEnergy = frame.energy?.kinetic ?? 0;
    const potentialEnergy = frame.energy?.potential ?? 0;
    const forceMagnitude = frame.forces.reduce((total, force) => total + Math.hypot(safeNum(force?.vector?.x), safeNum(force?.vector?.y)), 0);
    const collisionFrequency = safeNum(options.collisions?.length ?? frame.collisions.length, 0);
    const restitutionEfficiency = safeNum(options.restitution ?? frame.collisions.reduce((total, item) => total + safeNum(item?.restitution ?? 1, 1), 0) / Math.max(1, frame.collisions.length), 1);
    const acceleration = frame.entities.reduce((total, entity) => total + Math.hypot(entity.acceleration?.x ?? 0, entity.acceleration?.y ?? 0), 0) / Math.max(1, frame.entities.length);
    const now = performance.now();
    const deltaMs = Math.max(1, now - this.lastFrameTime);
    this.lastFrameTime = now;
    const fps = safeNum(options.fps ?? (1000 / deltaMs), 0);

    this.series.momentum.push(momentum);
    this.series.kineticEnergy.push(kineticEnergy);
    this.series.potentialEnergy.push(potentialEnergy);
    this.series.forceMagnitude.push(forceMagnitude);
    this.series.collisionFrequency.push(collisionFrequency);
    this.series.restitutionEfficiency.push(restitutionEfficiency);
    this.series.acceleration.push(acceleration);
    this.series.fps.push(fps);

    if (this.series.momentum.length > 500) {
      for (const key of Object.keys(this.series) as Array<keyof MetricSeries>) {
        this.series[key].splice(0, this.series[key].length - 500);
      }
    }

    const current: AnalyticsSnapshot = {
      frameId: frame.id,
      time: frame.time,
      metrics: {
        momentum,
        kineticEnergy,
        potentialEnergy,
        forceMagnitude,
        collisionFrequency,
        restitutionEfficiency,
        acceleration,
        fps,
        stability: this.computeStability(),
        momentumChangeRate: growthRate(this.series.momentum),
        energyChangeRate: growthRate(this.series.kineticEnergy),
      },
      rollingAverages: {
        momentum: windowAverage(this.series.momentum),
        kineticEnergy: windowAverage(this.series.kineticEnergy),
        potentialEnergy: windowAverage(this.series.potentialEnergy),
        forceMagnitude: windowAverage(this.series.forceMagnitude),
        fps: windowAverage(this.series.fps),
      },
      summary: this.buildSummary(frame),
    };

    this.snapshots.push(current);
    if (this.snapshots.length > 500) this.snapshots.splice(0, this.snapshots.length - 500);
    return current;
  }

  private computeStability() {
    const fps = windowAverage(this.series.fps);
    const momentum = windowAverage(this.series.momentum);
    const energy = windowAverage(this.series.kineticEnergy);
    const volatility = Math.abs(growthRate(this.series.momentum)) + Math.abs(growthRate(this.series.kineticEnergy));
    const score = Math.max(0, Math.min(100, 100 - volatility * 0.1 + fps * 0.2 - (momentum + energy) * 0.0001));
    return score;
  }

  private buildSummary(frame: ReplayFrame) {
    const collisions = frame.collisions.length;
    const kinetic = frame.energy?.kinetic ?? 0;
    const potential = frame.energy?.potential ?? 0;
    const total = frame.energy?.total ?? kinetic + potential;
    return `Frame ${frame.id}: ${frame.entities.length} entities, ${collisions} collisions, KE ${kinetic.toFixed(1)} J, PE ${potential.toFixed(1)} J, Total ${total.toFixed(1)} J.`;
  }

  getSeries() {
    return this.series;
  }

  getLatest() {
    return this.snapshots[this.snapshots.length - 1] || null;
  }

  getSnapshots() {
    return this.snapshots;
  }

  exportJSON() {
    return JSON.stringify({ series: this.series, snapshots: this.snapshots }, null, 2);
  }

  getEducationalSummary() {
    const latest = this.getLatest();
    if (!latest) return "No analytics data yet.";
    return `${latest.summary} Stability score ${latest.metrics.stability.toFixed(0)}%. Rolling momentum ${latest.rollingAverages.momentum.toFixed(2)}.`;
  }

  getDiagnostics() {
    const latest = this.getLatest();
    return {
      stability: latest?.metrics.stability ?? 0,
      fps: latest?.metrics.fps ?? 0,
      momentum: latest?.metrics.momentum ?? 0,
      kineticEnergy: latest?.metrics.kineticEnergy ?? 0,
      potentialEnergy: latest?.metrics.potentialEnergy ?? 0,
      forceMagnitude: latest?.metrics.forceMagnitude ?? 0,
      collisionFrequency: latest?.metrics.collisionFrequency ?? 0,
      restitutionEfficiency: latest?.metrics.restitutionEfficiency ?? 0,
    };
  }
}

export function createPhysicsAnalytics() {
  return new PhysicsAnalytics();
}

export default PhysicsAnalytics;
