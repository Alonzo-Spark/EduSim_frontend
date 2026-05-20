import runtimeEvents from "@/runtime/events/runtimeEvents";

export type ReplayFrame = {
  id: number;
  time: number;
  timestamp: number;
  paused: boolean;
  entities: Array<{
    id: string;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    acceleration?: { x: number; y: number };
    mass?: number;
    angle?: number;
    angularVelocity?: number;
  }>;
  collisions: any[];
  forces: any[];
  impulses: any[];
  equations: string[];
  energy: {
    kinetic: number;
    potential: number;
    total: number;
  };
  interactions: any[];
  runtimeState?: string;
  events: any[];
  graphSnapshot?: any;
};

export type ReplayExport = {
  version: string;
  createdAt: string;
  frames: ReplayFrame[];
  metadata: Record<string, any>;
};

type ReplayOptions = {
  maxFrames?: number;
  compression?: boolean;
};

function clone<T>(value: T): T {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function safeNum(value: any, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function compressEntities(entities: ReplayFrame["entities"], previous?: ReplayFrame["entities"]) {
  if (!previous) return entities;
  return entities.map((entity) => {
    const prior = previous.find((item) => item.id === entity.id);
    if (!prior) return entity;
    const positionDelta = {
      x: entity.position.x - prior.position.x,
      y: entity.position.y - prior.position.y,
    };
    const velocityDelta = {
      x: entity.velocity.x - prior.velocity.x,
      y: entity.velocity.y - prior.velocity.y,
    };
    return {
      ...entity,
      position: positionDelta,
      velocity: velocityDelta,
      __delta: true,
    } as any;
  });
}

export class SimulationReplay {
  private frames: ReplayFrame[] = [];
  private eventLog: any[] = [];
  private runtimeState: string = "READY";
  private playing = false;
  private loopEnabled = false;
  private speed = 1;
  private currentIndex = 0;
  private lastFrameById: Map<string, ReplayFrame["entities"][number]> = new Map();
  private unsubscribers: Array<() => void> = [];

  constructor(private options: ReplayOptions = {}) {}

  start() {
    this.stop();
    this.unsubscribers = [
      runtimeEvents.on("collision_start", (event) => this.pushEvent("collision_start", event)),
      runtimeEvents.on("collision_end", (event) => this.pushEvent("collision_end", event)),
      runtimeEvents.on("force_applied", (event) => this.pushEvent("force_applied", event)),
      runtimeEvents.on("equation_updated", (event) => this.pushEvent("equation_updated", event)),
      runtimeEvents.on("entity_spawned", (event) => this.pushEvent("entity_spawned", event)),
      runtimeEvents.on("preload_complete", (event) => this.pushEvent("preload_complete", event)),
      runtimeEvents.on("runtime_paused", (event) => this.pushEvent("runtime_paused", event)),
      runtimeEvents.on("runtime_resumed", (event) => this.pushEvent("runtime_resumed", event)),
      runtimeEvents.on("runtime_state_changed", (event) => {
        this.runtimeState = String(event?.state || this.runtimeState);
        this.pushEvent("runtime_state_changed", event);
      }),
    ];
  }

  stop() {
    this.unsubscribers.forEach((dispose) => dispose());
    this.unsubscribers = [];
  }

  clear() {
    this.frames = [];
    this.eventLog = [];
    this.lastFrameById.clear();
    this.currentIndex = 0;
  }

  record(snapshot: any, extras: Partial<ReplayFrame> = {}) {
    if (!snapshot) return null;
    const objects = Array.isArray(snapshot?.dsl?.objects) ? snapshot.dsl.objects : [];
    const entities = objects.map((object: any) => {
      const physics = object?.physics || {};
      return {
        id: String(object.id),
        position: {
          x: safeNum(physics.position?.x ?? object.position?.x ?? 0),
          y: safeNum(physics.position?.y ?? object.position?.y ?? 0),
        },
        velocity: {
          x: safeNum(physics.velocity?.x ?? object.velocity?.x ?? 0),
          y: safeNum(physics.velocity?.y ?? object.velocity?.y ?? 0),
        },
        acceleration: {
          x: safeNum(physics.acceleration?.x ?? object.acceleration?.x ?? 0),
          y: safeNum(physics.acceleration?.y ?? object.acceleration?.y ?? 0),
        },
        mass: safeNum(physics.mass ?? object.mass ?? 1, 1),
        angle: safeNum(physics.angle ?? object.angle ?? 0),
        angularVelocity: safeNum(physics.angularVelocity ?? object.angularVelocity ?? 0),
      };
    });

    const kinetic = entities.reduce((total, entity) => {
      const speed = Math.hypot(entity.velocity.x, entity.velocity.y);
      return total + 0.5 * entity.mass! * speed * speed;
    }, 0);

    const potential = entities.reduce((total, entity) => {
      return total + entity.mass! * 9.81 * Math.max(0, 10 - entity.position.y);
    }, 0);

    const previousEntities = this.frames.length > 0 ? this.frames[this.frames.length - 1].entities : undefined;
    const frame: ReplayFrame = {
      id: this.frames.length,
      time: safeNum(snapshot?.time ?? 0),
      timestamp: performance.now(),
      paused: Boolean(snapshot?.paused),
      entities: this.options.compression ? compressEntities(entities, previousEntities) : entities,
      collisions: clone(extras.collisions ?? []),
      forces: clone(extras.forces ?? []),
      impulses: clone(extras.impulses ?? []),
      equations: clone(extras.equations ?? snapshot?.dsl?.equations ?? []),
      energy: {
        kinetic,
        potential,
        total: kinetic + potential,
      },
      interactions: clone(snapshot?.dsl?.interactions ?? []),
      runtimeState: this.runtimeState,
      events: clone(this.eventLog.slice(-20)),
      graphSnapshot: clone(extras.graphSnapshot ?? null),
    };

    this.frames.push(frame);
    if (this.options.maxFrames && this.frames.length > this.options.maxFrames) {
      this.frames.splice(0, this.frames.length - this.options.maxFrames);
    }
    this.currentIndex = this.frames.length - 1;
    this.lastFrameById.clear();
    frame.entities.forEach((entity) => this.lastFrameById.set(entity.id, entity));
    return frame;
  }

  private pushEvent(type: string, payload: any) {
    this.eventLog.push({
      id: `${type}_${this.eventLog.length}`,
      type,
      payload: clone(payload),
      timestamp: performance.now(),
    });
    if (this.eventLog.length > 200) {
      this.eventLog.splice(0, this.eventLog.length - 200);
    }
  }

  getFrames() {
    return this.frames;
  }

  getCurrentFrame() {
    return this.frames[this.currentIndex] || null;
  }

  replay() {
    this.playing = true;
  }

  pauseReplay() {
    this.playing = false;
  }

  scrubTimeline(index: number) {
    if (!this.frames.length) return null;
    this.currentIndex = Math.max(0, Math.min(this.frames.length - 1, Math.round(index)));
    return this.getCurrentFrame();
  }

  jumpToFrame(index: number) {
    return this.scrubTimeline(index);
  }

  replaySpeed(multiplier: number) {
    this.speed = Math.max(0.1, Number(multiplier) || 1);
    return this.speed;
  }

  replayStep(direction = 1) {
    if (!this.frames.length) return null;
    return this.scrubTimeline(this.currentIndex + direction);
  }

  loopReplay(enabled = true) {
    this.loopEnabled = enabled;
    return this.loopEnabled;
  }

  isPlaying() {
    return this.playing;
  }

  getSpeed() {
    return this.speed;
  }

  getTimelineMarkers() {
    return this.frames.map((frame) => ({
      frameId: frame.id,
      time: frame.time,
      events: frame.events,
      collisionCount: frame.collisions.length,
      type: frame.collisions.length ? "collision" : frame.forces.length ? "force" : frame.equations.length ? "equation" : frame.runtimeState === "PAUSED" ? "pause" : "frame",
    }));
  }

  exportReplay(metadata: Record<string, any> = {}): ReplayExport {
    return {
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      frames: clone(this.frames),
      metadata,
    };
  }

  exportJSON(metadata: Record<string, any> = {}) {
    return JSON.stringify(this.exportReplay(metadata), null, 2);
  }

  exportEvents() {
    return clone(this.eventLog);
  }
}

export function createSimulationReplay(options: ReplayOptions = {}) {
  return new SimulationReplay(options);
}

export default SimulationReplay;
