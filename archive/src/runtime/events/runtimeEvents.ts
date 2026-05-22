export type RuntimeEventName =
  | "collision_start"
  | "collision_end"
  | "force_applied"
  | "equation_updated"
  | "entity_spawned"
  | "preload_complete"
  | "runtime_paused"
  | "runtime_resumed"
  | "interaction_updated"
  | "runtime_state_changed";

export type RuntimeEventPayload = Record<string, any> & { timestamp?: number };

type Listener = (payload: RuntimeEventPayload) => void;

class RuntimeEventBus {
  private listeners = new Map<RuntimeEventName, Set<Listener>>();

  on(event: RuntimeEventName, listener: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off(event: RuntimeEventName, listener: Listener) {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: RuntimeEventName, payload: RuntimeEventPayload = {}) {
    const nextPayload = { ...payload, timestamp: payload.timestamp ?? performance.now() };
    this.listeners.get(event)?.forEach((listener) => {
      try {
        listener(nextPayload);
      } catch (error) {
        console.warn("[runtimeEvents] listener failed", event, error);
      }
    });
  }

  clear() {
    this.listeners.clear();
  }
}

export const runtimeEvents = new RuntimeEventBus();
export default runtimeEvents;
