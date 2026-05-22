type RuntimeLike = {
  play?: () => void;
  pause?: () => void;
  reset?: () => void;
  step?: () => void;
  setSpeed?: (s: number) => void;
  getState?: () => any;
  destroy?: () => void;
};

import runtimeEvents from "@/runtime/events/runtimeEvents";

export const RuntimeState = {
  IDLE: "IDLE",
  GENERATING: "GENERATING",
  VALIDATING: "VALIDATING",
  NORMALIZING: "NORMALIZING",
  PRELOADING_ASSETS: "PRELOADING_ASSETS",
  INITIALIZING_RUNTIME: "INITIALIZING_RUNTIME",
  READY: "READY",
  RUNNING: "RUNNING",
  PAUSED: "PAUSED",
  ERROR: "ERROR",
  DESTROYED: "DESTROYED",
} as const;

type RuntimeStateKey = keyof typeof RuntimeState | (string & {});

export class SimulationController {
  runtime: RuntimeLike | null = null;
  state: RuntimeStateKey = RuntimeState.IDLE;
  speed = 1;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(runtime?: RuntimeLike) {
    if (runtime) this.attachRuntime(runtime);
  }

  attachRuntime(runtime: RuntimeLike) {
    // Build a small adapter giving a normalized API surface used by the controller
    const adapter: RuntimeLike = {
      play: () => {
        // prefer resume, then start, then play
        try {
          if ((runtime as any).resume) return (runtime as any).resume();
          if ((runtime as any).play) return (runtime as any).play();
          if ((runtime as any).start) return (runtime as any).start();
        } catch (e) {}
      },
      pause: () => {
        try {
          if ((runtime as any).pause) return (runtime as any).pause();
          if ((runtime as any).stop) return (runtime as any).stop();
        } catch (e) {}
      },
      reset: () => {
        try {
          if ((runtime as any).reset) return (runtime as any).reset();
        } catch (e) {}
      },
      step: () => {
        try {
          const fn = (runtime as any).step;
          if (!fn) return;
          // if step expects a dt parameter, call with 1/60
          if (fn.length >= 1) return fn.call(runtime, 1 / 60);
          return fn.call(runtime);
        } catch (e) {}
      },
      setSpeed: (s: number) => {
        try {
          if ((runtime as any).setSpeed) return (runtime as any).setSpeed(s);
          if ((runtime as any).set_speed) return (runtime as any).set_speed(s);
        } catch (e) {}
      },
      getState: () => {
        try { return (runtime as any).getState ? (runtime as any).getState() : null; } catch (e) { return null; }
      },
      destroy: () => { try { (runtime as any).destroy?.(); } catch (e) {} },
    };

    this.runtime = adapter;
    // if runtime is present, mark READY
    this.transitionTo(RuntimeState.READY);
    this.emit("attached", { runtime: adapter });
    runtimeEvents.emit("runtime_state_changed", { state: this.state });
  }

  detachRuntime() {
    this.runtime = null;
    this.transitionTo(RuntimeState.IDLE);
  }

  on(event: string, cb: Function) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
    return () => this.off(event, cb);
  }

  off(event: string, cb: Function) {
    this.listeners.get(event)?.delete(cb);
  }

  emit(event: string, payload?: any) {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(payload);
      } catch (e) {
        // swallow
      }
    });
  }

  transitionTo(next: RuntimeStateKey) {
    // Basic guarded transitions to prevent invalid flows
    const allowed: Record<string, string[]> = {
      IDLE: ["GENERATING", "DESTROYED"],
      GENERATING: ["VALIDATING", "ERROR"],
      VALIDATING: ["NORMALIZING", "ERROR"],
      NORMALIZING: ["PRELOADING_ASSETS", "ERROR"],
      PRELOADING_ASSETS: ["INITIALIZING_RUNTIME", "ERROR"],
      INITIALIZING_RUNTIME: ["READY", "ERROR"],
      READY: ["RUNNING", "PAUSED", "ERROR", "DESTROYED"],
      RUNNING: ["PAUSED", "ERROR", "READY", "DESTROYED"],
      PAUSED: ["RUNNING", "READY", "ERROR", "DESTROYED"],
      ERROR: ["READY", "DESTROYED"],
      DESTROYED: [],
    };

    const current = this.state;
    const allowedNext = allowed[current] || [];
    if (current === next) return;
    if (allowedNext.length && !allowedNext.includes(next)) {
      // allow transitions from any state to ERROR or DESTROYED
      if (next !== RuntimeState.ERROR && next !== RuntimeState.DESTROYED) {
        console.warn(`[SimulationController] Invalid transition from ${current} -> ${next}`);
        return;
      }
    }
    this.state = next;
    this.emit("state", { state: this.state });
    runtimeEvents.emit("runtime_state_changed", { state: this.state });
  }

  play() {
    if (!this.runtime) return;
    if (this.state === RuntimeState.DESTROYED || this.state === RuntimeState.ERROR) return;
    this.runtime.play?.();
    this.transitionTo(RuntimeState.RUNNING);
    this.emit("play");
    runtimeEvents.emit("runtime_resumed", { state: this.state });
  }

  pause() {
    if (!this.runtime) return;
    this.runtime.pause?.();
    this.transitionTo(RuntimeState.PAUSED);
    this.emit("pause");
    runtimeEvents.emit("runtime_paused", { state: this.state });
  }

  togglePause() {
    if (this.state === RuntimeState.RUNNING) this.pause();
    else this.play();
  }

  reset() {
    if (!this.runtime) return;
    this.runtime.reset?.();
    this.transitionTo(RuntimeState.READY);
    this.emit("reset");
    runtimeEvents.emit("runtime_state_changed", { state: this.state, action: "reset" });
  }

  restart() {
    if (!this.runtime) return;
    this.runtime.reset?.();
    this.runtime.play?.();
    this.transitionTo(RuntimeState.RUNNING);
    this.emit("restart");
    runtimeEvents.emit("runtime_resumed", { state: this.state, action: "restart" });
  }

  stop() {
    if (!this.runtime) return;
    this.runtime.pause?.();
    this.transitionTo(RuntimeState.READY);
    this.emit("stop");
    runtimeEvents.emit("runtime_paused", { state: this.state, action: "stop" });
  }

  async step() {
    if (!this.runtime) return;
    // stepping should temporarily unpause for a single tick
    this.runtime.step?.();
    this.emit("step");
  }

  setSpeed(multiplier: number) {
    this.speed = multiplier;
    this.runtime?.setSpeed?.(multiplier);
    this.emit("speed", { speed: multiplier });
    runtimeEvents.emit("equation_updated", { kind: "speed", speed: multiplier });
  }

  seek(time: number) {
    // Seek is best-effort: attempt to reset and then advance via stepping or set state
    if (!this.runtime) return;
    try {
      if (typeof this.runtime.setTime === "function") {
        this.runtime.setTime(time);
      } else {
        // fallback: reset then step forward conservatively (not precise)
        this.runtime.reset?.();
      }
      this.emit("seek", { time });
    } catch (e) {
      console.warn("Seek not supported on runtime", e);
    }
  }

  destroy() {
    this.transitionTo(RuntimeState.DESTROYED);
    this.runtime?.destroy?.();
    this.emit("destroy");
    this.listeners.clear();
    this.runtime = null;
    runtimeEvents.emit("runtime_state_changed", { state: this.state });
  }
}

export default SimulationController;
